
import QuestionView from 'core/js/views/questionView';

class SelectChoiceView extends QuestionView {

  initialize(...args) {
    this.onKeyPress = this.onKeyPress.bind(this);
    this.onItemOptionSelect = this.onItemOptionSelect.bind(this);
    super.initialize(...args);
  }

  setupQuestion() {
    this.model.setupRandomisation();
  }

  onQuestionRendered() {
    this.$('.selectchoice__item').imageready(() => this.setReadyStatus());

  }

  onKeyPress(event) {

    if (event.which !== 13) return;
    // <ENTER> keypress
    this.onItemOptionSelect(event);
  }

  onItemOptionSelect(event) {
    if (!this.model.isInteractive()) return;

    const $input = $(event.currentTarget);
    const itemIndex = $input.data('adapt-index');
    const optionIndex = parseInt($input.val());
    this.model.setOptionSelected(itemIndex, optionIndex, true);
    this.model.set('_highlighted', `${itemIndex}-${optionIndex}`);

  }

  resetQuestion() {
    this.$('.selectchoice__item').removeClass('is-correct is-incorrect');
    this.model.set('_isAtLeastOneCorrectSelection', false);

    this.model.get('_items').forEach(item => {
     // if (item._isCorrect) return;
      item._options.forEach(option => (option._isSelected = false));
      item._selected = null;
    });
  }

  // showCorrectAnswer() {
  //   this.model.set('_isCorrectAnswerShown', true);
  // }

  // hideCorrectAnswer() {
  //   this.model.set('_isCorrectAnswerShown', false);
  // }

}
SelectChoiceView.template = 'selectchoice.jsx';

export default SelectChoiceView;
