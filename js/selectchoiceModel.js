import Adapt from 'core/js/adapt';
import QuestionModel from 'core/js/models/questionModel';

export default class SelectChoiceModel extends QuestionModel {
  init() {
    super.init();

    this.setupQuestionItemIndexes();
  }

  reset(type = 'hard', canReset = this.get('_canReset')) {
    const wasReset = super.reset(type, canReset);
    if (!wasReset) return false;
    this.set('_isAtLeastOneCorrectSelection', false);
    this.get('_items').forEach((item) => {
      item._options.forEach((option) => (option._isSelected = false));
      item._selected = null;
    });
    return true;
  }

  setupQuestionItemIndexes() {
    this.get('_choices').forEach((choice, index) => {
      if (choice._value === undefined) {
        choice._value = index + 1;
      }
    });

    this.get('_items').forEach((item, index) => {
      if (item._index === undefined) {
        item._index = index;
        item._selected = false;
      }
      if (item._options === undefined) {
        item._options = this.get('_choices').map((choice) => {
          return {
            text: choice.text,
            _graphic: choice._graphic,
            _value: choice._value,
            _isCorrect: choice._value === item._shouldBeSelected
          };
        });
      }
      item._options.forEach((option, index) => {
        if (option._index !== undefined) return;
        option._index = index;
        option._isSelected = false;
      });
    });
  }

  setupRandomisation() {
    if (!this.get('_isRandom') || !this.get('_isEnabled')) return;
    const items = _.shuffle(_.clone(this.get('_items')));
    items.forEach((item, newIndex) => {
      item._originalIndex = item._index;
      item._index = newIndex;
    });
    this.set('_items', items);
  }

  restoreUserAnswers() {
    if (!this.get('_isSubmitted')) return;

    const userAnswer = this.get('_userAnswer');
    this.get('_items').forEach((item) => {
      const indexToRestore = item._originalIndex !== undefined ? item._originalIndex : item._index;
      item._options.forEach((option) => {
        if (option._index !== userAnswer[indexToRestore]) return;
        option._isSelected = true;
        item._selected = option;
      });
    });

    this.setQuestionAsSubmitted();
    this.checkCanSubmit();
    this.markQuestion();
    this.setScore();
    this.setupFeedback();
  }

  canSubmit() {
    const canSubmit = this.get('_items').every(({ _options }) => {
      return _options.some(({ _isSelected }) => _isSelected);
    });

    return canSubmit;
  }

  setOptionSelected(itemIndex, optionIndex, isSelected) {
    const item = this.get('_items')[itemIndex];
    const _optionIndex = optionIndex - 1;
    if (isNaN(_optionIndex)) {
      item._options.forEach((option) => (option._isSelected = false));
      item._selected = null;
      return this.checkCanSubmit();
    }
    const option = item._options.find(({ _index }) => _index === _optionIndex);
    option._isSelected = isSelected;
    item._selected = option;
    this.checkCanSubmit();
  }

  storeUserAnswer() {
    const userAnswer = new Array(this.get('_items').length);

    this.get('_items').forEach((item) => {
      const optionIndex = item._options.findIndex(({ _isSelected }) => _isSelected);
      const indexToStore = item._originalIndex !== undefined ? item._originalIndex : item._index;
      userAnswer[indexToStore] = item._options[optionIndex]._value - 1;
    });

    this.set({
      _userAnswer: userAnswer
    });
  }

  isCorrect() {
    const numberOfCorrectAnswers = this.get('_items').reduce((a, item) => {
      const isCorrect = item._selected?._isCorrect;
      item._isCorrect = Boolean(isCorrect);
      if (!isCorrect) {
        return a;
      }
      this.set('_isAtLeastOneCorrectSelection', true);
      return ++a;
    }, 0);

    this.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);

    if (numberOfCorrectAnswers === this.get('_items').length) {
      return true;
    }

    return false;
  }

  setScore() {
    const questionWeight = this.get('_questionWeight');

    if (this.get('_isCorrect')) {
      this.set('_score', questionWeight);
      return;
    }

    const numberOfCorrectAnswers = this.get('_numberOfCorrectAnswers');
    const itemLength = this.get('_items').length;

    const score = (questionWeight * numberOfCorrectAnswers) / itemLength;

    this.set('_score', score);
  }

  isPartlyCorrect() {
    return this.get('_isAtLeastOneCorrectSelection');
  }

  resetUserAnswer() {
    this.set('_userAnswer', []);
  }

  getInteractionObject() {
    const interactions = {
      correctResponsesPattern: null,
      source: null,
      target: null
    };
    const items = this.get('_items');

    interactions.correctResponsesPattern = [
      items
        .map(({ _options }, questionIndex) => {
          questionIndex++;
          return [
            questionIndex,

            _options
              .filter(({ _isCorrect }) => _isCorrect)
              .map(({ _index }) => {
                return `${questionIndex}_${_index + 1}`;
              })
          ].join('[.]');
        })
        .join('[,]')
    ];

    interactions.source = items
      .map((item) => {
        return {
          // Offset by 1.
          id: `${item._index + 1}`,
          description: item.text
        };
      })
      .flat(Infinity);

    interactions.target = items
      .map(({ _options }, index) => {
        index++;
        return _options.map((option) => {
          return {
            id: `${index}_${option._index + 1}`,
            description: option.text
          };
        });
      })
      .flat(Infinity);
    return interactions;
  }

  getResponse() {
    const responses = this.get('_userAnswer').map((userAnswer, index) => {
      return `${index + 1}.${userAnswer + 1}`;
    });

    return responses.join('#');
  }

  getResponseType() {
    return 'matching';
  }

  getCorrectAnswerAsText() {
    const correctAnswerTemplate = Adapt.course.get('_globals')._components._selectchoice.ariaCorrectAnswer;
    const ariaAnswer = this.get('_items')
      .map((item) => {
        const correctOption = item._options.find(({ _isCorrect }) => _isCorrect);
        return Handlebars.compile(correctAnswerTemplate)({
          itemText: item.text,
          correctAnswer: correctOption.text
        });
      })
      .join('<br>');

    return ariaAnswer;
  }

  getUserAnswerAsText() {
    const userAnswerTemplate = Adapt.course.get('_globals')._components._selectchoice.ariaUserAnswer;
    const answerArray = this.get('_userAnswer');

    const ariaAnswer = this.get('_items')
      .map((item, index) => {
        const key = answerArray[index];
        return Handlebars.compile(userAnswerTemplate)({
          itemText: item.text,
          userAnswer: item._options[key].text
        });
      })
      .join('<br>');

    return ariaAnswer;
  }
}
