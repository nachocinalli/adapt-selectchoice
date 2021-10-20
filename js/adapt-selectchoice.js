import Adapt from 'core/js/adapt';
import SelectChoiceView from './selectchoiceView';
import SelectChoiceModel from './selectchoiceModel';

export default Adapt.register('selectchoice', {
  view: SelectChoiceView,
  model: SelectChoiceModel
});
