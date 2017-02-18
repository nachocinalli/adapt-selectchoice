define(function(require) {
    var QuestionView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');

    var Selectchoice = QuestionView.extend({

        events: {
            'change .selectchoice-item input': 'onItemSelected',
            'keyup .selectchoice-item input':'onKeyPress'
        },

       resetQuestionOnRevisit: function() {
            this.setAllItemsEnabled(true);
            this.resetQuestion();
        },

        setupQuestion: function() {
                    
            this.model.set('_selectedItems', []);

            this.setupQuestionItemIndexes();

            this.setupRandomisation();
            
            this.restoreUserAnswers();
        },

        setupQuestionItemIndexes: function() {
            var items = this.model.get("_items");
            if (items && items.length > 0) {
                for (var i = 0, l = items.length; i < l; i++) {
                    if (items[i]._index === undefined) items[i]._index = i;
                }
            }
        },

        setupRandomisation: function() {
            if (this.model.get('_isRandom') && this.model.get('_isEnabled')) {
                this.model.set("_items", _.shuffle(this.model.get("_items")));
            }
        },
        restoreUserAnswers: function() {
            if (!this.model.get("_isSubmitted")) return;

            var selectedItems = [];
            var items = this.model.get("_items");
            var userAnswer = this.model.get("_userAnswer");
            _.each(items, function(item, index) {
                item.selected = userAnswer[item._index];
                selectedItems.push(item)
                
            });

            this.model.set("_selectedItems", selectedItems);

            this.setQuestionAsSubmitted();
            this.markQuestion();
            this.setScore();
            this.showMarking();
            this.setupFeedback();
            
        },
        disableQuestion: function() {
            this.setAllItemsEnabled(false);
        },

        enableQuestion: function() {
            this.setAllItemsEnabled(true);
        },

        setAllItemsEnabled: function(isEnabled) {
            var id = this.model.get('_id') 
            
            _.each(this.model.get('_items'), function(item, index){
                var $itemLabel = this.$('label').eq(index);
                var name = id+'-item-'+index
                var $itemInput = this.$('input[name="'+name+'"]')
                
                if (isEnabled) {
                    $itemLabel.removeClass('disabled');
                    $itemInput.prop('disabled', false);
                } else {
                    $itemLabel.addClass('disabled');
                    $itemInput.prop('disabled', true);
                }
            }, this);
        },
       onQuestionRendered: function() {
            this.setReadyStatus();
        },
 
        onKeyPress: function(event) {
            if (event.which === 13) { 
                this.onItemSelected(event);
            }
        },
        onItemSelected: function(event) {
           
            if(this.model.get('_isEnabled') && !this.model.get('_isSubmitted')){             
                var selectedItemObject = this.model.get('_items')[$(event.currentTarget).closest('.component-item').index()-1];                 
                this.choiceItemSelected(selectedItemObject, $(event.target));
            }
        },
  
      
        choiceItemSelected: function(item, choice) {
            var selectedItems = this.model.get('_selectedItems');
            var itemIndex = _.indexOf(this.model.get('_items'), item) 
            item.selected = choice.data( "choice" )
            selectedItems[itemIndex] = item
            item._isSelected = true;
             $itemLabel = this.$('label').eq(itemIndex)
            $itemLabel.addClass('selected');
            this.model.set('_selectedItems', selectedItems);
        },
    
        canSubmit: function() {
           
          var count = 0;

            _.each(this.model.get('_items'), function(item) {
                if (item._isSelected) {
                    count++;
                }
            }, this);

            return (count === this.model.get('_selectable'))

        },
        onCannotSubmit: function() {},
        canReset: function() {
            return !this.$('.selectchoice-widget, .button.reset').hasClass('disabled');
        },

         storeUserAnswer: function() {
            var userAnswer = [];

            var items = this.model.get('_items').slice(0);
            items.sort(function(a, b) {
                return a._index - b._index;
            });

            _.each(items, function(item, index) {
                userAnswer.push(item.selected);
            }, this);
            this.model.set('_userAnswer', userAnswer);
         
        },

        isCorrect: function() {

            var numberOfRequiredAnswers = this.model.get('_selectable');
            var numberOfCorrectAnswers = 0;
            var numberOfIncorrectAnswers = 0;

            _.each(this.model.get('_items'), function(item, index) {
                var correct = (item.selected === item._shouldBeSelected);                          
                    if (correct) {
                        numberOfCorrectAnswers ++;
                        item._isCorrect = true;
                        if(numberOfCorrectAnswers>(numberOfRequiredAnswers/2))
                        {
                            this.model.set('_isAtLeastOneCorrectSelection', true);
                        }
                    }

                 else {
                    numberOfIncorrectAnswers ++;
                }

            }, this);

            this.model.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);
            this.model.set('_numberOfRequiredAnswers', numberOfRequiredAnswers);

            var answeredCorrectly = (numberOfCorrectAnswers === numberOfRequiredAnswers) && (numberOfIncorrectAnswers === 0);
            return answeredCorrectly;
        },

            setScore: function() {
            var questionWeight = this.model.get("_questionWeight");
            var answeredCorrectly = this.model.get('_isCorrect');
            var score = answeredCorrectly ? questionWeight : 0;
            this.model.set('_score', score);
        },

        setupFeedback: function() {

            if (this.model.get('_isCorrect')) {
                this.setupCorrectFeedback();
            } else if (this.isPartlyCorrect()) {
                this.setupPartlyCorrectFeedback();
            } else {
                // apply individual item feedback
                if((this.model.get('_selectable') === 1) && this.model.get('_selectedItems')[0].feedback) {
                    this.setupIndividualFeedback(this.model.get('_selectedItems')[0]);
                    return;
                } else {
                    this.setupIncorrectFeedback();
                }
            }
        },

        setupIndividualFeedback: function(selectedItem) {
             this.model.set({
                 feedbackTitle: this.model.get('title'),
                 feedbackMessage: selectedItem.feedback
             });
        },

        showMarking: function() {
            if (!this.model.get('_canShowMarking')) return;

            _.each(this.model.get('_items'), function(item, i) {
                var $item = this.$('.component-item').eq(i);
                $item.removeClass('correct incorrect').addClass(item._isCorrect ? 'correct' : 'incorrect');
            }, this);
        },

        isPartlyCorrect: function() {
            return this.model.get('_isAtLeastOneCorrectSelection');
        },

        resetUserAnswer: function() {
            this.model.set({_userAnswer: []});
        },

        resetQuestion: function() {
            this.deselectAllItems();
            this.resetItems();
        },

        deselectAllItems: function() {
            this.$el.a11y_selected(false);
            _.each(this.model.get('_items'), function(item) {
                item._isSelected = false;
            }, this);
        },

        resetItems: function() {
            this.$('.component-item label').removeClass('selected');
            this.$('.component-item').removeClass('correct incorrect');
            this.$('input').prop('checked', false);
            this.model.set({
                _selectedItems: [],
                _isAtLeastOneCorrectSelection: false
            });
        },

        showCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, item._shouldBeSelected);
            }, this);
        },

        setOptionSelected:function(index, selected) {
            var $itemLabel = this.$('label').eq(index);
            var id = this.model.get('_id') 
            var name = id+'-item-'+index
            var $input = this.$("#"+id+'-'+index+"-"+selected)
            var $itemInputGroup = this.$('input[name="'+name+'"]')
            
            $itemLabel.addClass('selected');
            $itemInputGroup.prop('checked', false);
            $input.prop('checked', true);
          
        },

        hideCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, this.model.get('_userAnswer')[item._index]);
            }, this);
        },

        getResponse:function() {
          
            var selected = _.where(this.model.get('_items'), {'_isSelected':true});
            var selectedIndexes = _.pluck(selected, 'selected');
            return selectedIndexes.join(',');
        },

        getResponseType:function() {
            return "choice";
        }

    });

    Adapt.register("selectchoice", Selectchoice);

    return Selectchoice;
});
