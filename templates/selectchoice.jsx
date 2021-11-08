import Adapt from 'core/js/adapt';
import React from 'react';
import { templates, classes, html, compile } from 'core/js/reactHelpers';

export default function SelectChoice(props) {
  const ariaLabels = Adapt.course.get('_globals')._accessibility._ariaLabels;

  const {
    _id,
    _isEnabled,
    _isInteractionComplete,
    _isCorrect,
    _canShowMarking,
    displayTitle,
    body,
    instruction,
    onKeyPress,
    onItemOptionSelect,
    _isCorrectAnswerShown,
    isInteractive
  } = props;

  const shouldShowMarking = isInteractive() && _canShowMarking;

  return (
    <div className='component__inner selectchoice__inner'>
      <templates.header {...props} />

      <div
        className={classes([
          'component__widget',
          'selectchoice__widget',
          !_isEnabled && 'is-disabled',
          _isInteractionComplete && 'is-complete is-submitted show-user-answer',
          _isCorrect && 'is-correct'
        ])}
        role='radiogroup'
        aria-labelledby={
          (displayTitle || body || instruction) && `${_id}-header`
        }
      >
        <div className='selectchoice__item-head selectchoice__item'>
          <div className='selectchoice__item-text'></div>
          <div className='selectchoice__item-choices'>
            {props._choices.map((option) => (
              <div className='selectchoice__item-choice' key={option._value}>
                <label aria-hidden={true}>
                  <div className='selectchoice__item-choice-text'>
                    {html(compile(option.text))}
                  </div>
                  {option._graphic.large &&
                    <templates.image {...option._graphic}
                      classNamePrefixes={['selectchoice__item-choice']}
                      attributionClassNamePrefixes={['component', 'selectchoice']}
                    />
                  }
                </label>
              </div>
            ))}
          </div>
        </div>
        {props._items.map(({ text, _graphic, _options, _index, _isCorrect, _selected, _shouldBeSelected }, index) => (
          <div
            className={classes([
              `selectchoice__item item-${index}`,
              _selected && 'is-selected',
              _selected && `selected-option-${_selected._value}`,
              _isInteractionComplete && _isCorrect && 'is-correct',
              _isInteractionComplete && !_isCorrect && 'is-incorrect'
            ])}
            key={_index}>
            <div
              className={classes([
                'selectchoice__item-state',
                _isInteractionComplete && _isCorrect && 'selectchoice__item-correct-icon',
                _isInteractionComplete && !_isCorrect && 'selectchoice__item-incorrect-icon'
              ])}
            >
              <div className='icon'></div>
            </div>
            <div className='selectchoice__item-text'>
              {html(compile(text))}
            </div>
            <templates.image {..._graphic}
              classNamePrefixes={['selectchoice__item']}
              attributionClassNamePrefixes={['component', 'selectchoice']}
            />
            <div className='selectchoice__item-choices'>
              {_options.map((option) => (
                <div
                  className='selectchoice__item-choice'
                  key={option._index}
                >
                  <label
                    aria-hidden={true}
                    htmlFor={`input-${props._id}-${_index}-${option._value}`}
                    data-adapt-index={_index}
                  >

                    <div className='selectchoice__item-choice-text'>
                      {html(compile(option.text))}
                    </div>
                    {option._graphic.large &&
                      <templates.image {...option._graphic}
                        classNamePrefixes={['selectchoice__item-choice']}
                        attributionClassNamePrefixes={['component', 'selectchoice']}
                      />
                    }
                    <div
                      className={classes([
                        'selectchoice__item-icon',

                        _selected &&
                          (_isCorrectAnswerShown
                            ? _shouldBeSelected === option._value
                            : _selected._value === option._value)
                          ? 'is-selected'
                          : ''
                      ])}
                    >
                      <div className='icon'></div>
                    </div>
                  </label>
                  <input
                    type='radio'
                    name={`choices-${props._id}-${_index}`}
                    id={`input-${props._id}-${_index}-${option._value}`}
                    value={option._value}
                    disabled={!_isEnabled}
                    aria-label={
                      !shouldShowMarking
                        ? `${
                          _isCorrect
                            ? ariaLabels.correct
                            : ariaLabels.incorrect
                        }, ${Adapt.a11y.normalize(text)}`
                        : `${Adapt.a11y.normalize(text)}`
                    }
                    data-adapt-index={_index}
                    onKeyPress={onKeyPress}
                    onChange={onItemOptionSelect}
                  />
                </div>
              ))}
            </div>
          </div>
        )
        )}
      </div>

      <div className='btn__container'></div>
    </div>
  );
}
