define(function(require) {
    var QuestionView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');

    var Selectchoice = QuestionView.extend({

        events: {
            'focus .selectchoice-item input': 'onItemFocus',
            'blur .selectchoice-item input': 'onItemBlur',
            'change .selectchoice-item input.rtrue': 'onItemSelectedTrue',
            'change .selectchoice-item input.rfalse': 'onItemSelectedFalse',
            "click .selectchoice-widget .button.submit": "onSubmitClicked",
            "click .selectchoice-widget .button.reset": "onResetClicked",
            "click .selectchoice-widget .button.model": "onModelAnswerClicked",
            "click .selectchoice-widget .button.user": "onUserAnswerClicked"
        },

        initialize: function() {
            QuestionView.prototype.initialize.apply(this, arguments);

            this.model.set('_selectedItems', []);
        },

        preRender: function() {
            QuestionView.prototype.preRender.apply(this);

            if (this.model.get('_isRandom') && this.model.get('_isEnabled')) {
                this.model.set("_items", _.shuffle(this.model.get("_items")));
            }
        },

        postRender: function() {
            QuestionView.prototype.postRender.apply(this);

            this.setResetButtonEnabled(false);
            this.setReadyStatus();
        },

        resetQuestion: function(properties) {
            QuestionView.prototype.resetQuestion.apply(this, arguments);

            _.each(this.model.get('_items'), function(item) {
                item.selected = false;
            }, this);
        },

        canSubmit: function() {
            // console.log(this.getNumberOfOptionsSelected() +'>='+ this.model.get('_selectable'))
            return this.getNumberOfOptionsSelected() >= this.model.get('_selectable');
        },

        canReset: function() {
            return !this.$('.selectchoice-widget, .button.reset').hasClass('disabled');
        },

        forEachAnswer: function(callback) {
            _.each(this.model.get('_items'), function(item, index) {

                var idChoice = item.selectedId.split("-")
                    // console.log(idChoice[idChoice.length-1] +" == "+ item._shouldBeSelected)
                var correctSelection = idChoice[idChoice.length - 1] == item._shouldBeSelected;
                if (item.selected && correctSelection) {
                    this.model.set('_isAtLeastOneCorrectSelection', true);
                }
                callback(correctSelection, item);
            }, this);
        },

        markQuestion: function() {
            this.forEachAnswer(function(correct, item) {
                item.correct = correct;
            });
            QuestionView.prototype.markQuestion.apply(this);
        },

        resetItems: function() {
            this.$('.selectchoice-item label').removeClass('selected');
            this.$('input').prop('checked', false);
            this.deselectAllItems();
            this.setAllItemsEnabled(true);
        },

        getNumberOfOptionsSelected: function() {
            var count = 0;

            _.each(this.model.get('_items'), function(item) {
                if (item.selected) count++;
            }, this);

            return count;
        },

        deselectAllItems: function() {
            _.each(this.model.get('_items'), function(item) {
                item.selected = false;
            }, this);
        },

        setAllItemsEnabled: function(enabled) {
            _.each(this.model.get('_items'), function(item, index) {
                var $itemLabel = this.$('label').eq(index);
                var $itemInput1 = this.$('input.rtrue').eq(index);
                var $itemInput2 = this.$('input.rfalse').eq(index);

                $itemLabel.toggleClass('disabled', !enabled);
                $itemInput1.prop('disabled', !enabled);
                $itemInput2.prop('disabled', !enabled);
            }, this);
        },

        setResetButtonEnabled: function(enabled) {
            this.$('.button.reset').toggleClass('disabled', !enabled);
        },

        setOptionSelected: function(index, selected) {
            var $itemLabel = this.$('label').eq(index);
            var $itemInput1 = this.$('input.rtrue').eq(index);
            var $itemInput2 = this.$('input.rfalse').eq(index);
            $itemLabel.toggleClass('selected', selected == 0 ? true : false);
            $itemInput1.prop('checked', selected == 0 ? true : false);
            $itemInput2.prop('checked', selected == 1 ? true : false);

        },

        storeUserAnswer: function() {
            var userAnswer = [];
            var customUserAnswer = [];
            _.each(this.model.get('_items'), function(item, index) {
                userAnswer.push(item.selected);
                customUserAnswer.push({ 'selectedId': item.selectedId, 'selected': item.selected })
            }, this);
            this.model.set('_userAnswer', userAnswer);
            this.model.set('_customUserAnswer', customUserAnswer);
        },
        isCorrect: function() {

            var numberOfRequiredAnswers = 0;
            var numberOfCorrectAnswers = 0;
            var numberOfIncorrectAnswers = 0;

            _.each(this.model.get('_items'), function(item, index) {



                if (item.correct) {
                    numberOfRequiredAnswers++;

                    numberOfCorrectAnswers++;

                    item._isCorrect = true;

                    this.model.set('_isAtLeastOneCorrectSelection', true);


                } else {
                    numberOfIncorrectAnswers++;
                }

            }, this);

            this.model.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);
            this.model.set('_numberOfRequiredAnswers', numberOfRequiredAnswers);
            var answeredCorrectly = (numberOfCorrectAnswers === numberOfRequiredAnswers) && (numberOfIncorrectAnswers === 0);
            return answeredCorrectly;
        },
        onItemFocus: function(event) {
            $(event.currentTarget).prev('label').addClass('highlighted');
        },

        onItemBlur: function(event) {
            $(event.currentTarget).prev('label').removeClass('highlighted');
        },

        onItemSelectedTrue: function(event) {
            var selectedItemObject = this.model.get('_items')[$(event.currentTarget).parents('.selectchoice-item').index() - 1];
            this.putItemSelected(selectedItemObject, true, $(event.target).attr('id'));
        },
        onItemSelectedFalse: function(event) {
            var selectedItemObject = this.model.get('_items')[$(event.currentTarget).parents('.selectchoice-item').index() - 1];
            this.putItemSelected(selectedItemObject, true, $(event.target).attr('id'));
        },
        putItemSelected: function(item, selected, selectedId) {
            var selectedItems = this.model.get('_selectedItems');
            item.selected = selected;
            item.selectedId = selectedId;
            var findId = this.in_array(item.selectedId, selectedItems)
            if (findId == -1) {
                selectedItems.push(item);
            } else {
                selectedItems[findId] = item
            }
            this.model.set('_selectedItems', selectedItems);
        },
        in_array: function(search, array) {
            var r = -1
            for (i = 0; i < array.length; i++) {
                if (array[i].selectedId == search) {
                    r = i;
                    break;
                }
            }
            return r;
        },


        onResetClicked: function(event) {
            if (this.canReset()) {
                QuestionView.prototype.onResetClicked.apply(this, arguments);
            } else {
                if (event) {
                    event.preventDefault();
                }
            }
        },

        onSubmitClicked: function(event) {
            QuestionView.prototype.onSubmitClicked.apply(this, arguments);

            if (this.canSubmit()) {
                this.setAllItemsEnabled(false);
                this.setResetButtonEnabled(!this.model.get('_isComplete'));
            }
        },

        onModelAnswerShown: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, item._shouldBeSelected);
            }, this);
        },
        showCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, item._shouldBeSelected);
            }, this);
        },

        hideCorrectAnswer: function(event) {
            this.setAllItemsEnabled(false);
            this.deselectAllItems();
            _.each(this.model.get('_items'), function(item, index) {

                var $itemLabel = this.$('label').eq(index);
                $itemLabel.toggleClass('selected', item._shouldBeSelected == 0 ? true : false);

                var $objSelected = this.model.get('_customUserAnswer')[index];
                $('#' + $objSelected.selectedId).prop('checked', true)


            }, this);
        }

    });

    Adapt.register("selectchoice", Selectchoice);

    return Selectchoice;
});
