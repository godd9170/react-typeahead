/**
 * @jsx React.DOM
 */

var React = require('react/addons');
var TypeaheadSelector = require('./selector');
var KeyEvent = require('../keyevent');
var fuzzy = require('fuzzy');
var classNames = require('classnames');

/**
 * A "typeahead", an auto-completing text input
 *
 * Renders an text input that shows options nearby that you can use the
 * keyboard or mouse to select.  Requires CSS for MASSIVE DAMAGE.
 */
var Typeahead = React.createClass({displayName: "Typeahead",
  propTypes: {
    name: React.PropTypes.string,
    customClasses: React.PropTypes.object,
    maxVisible: React.PropTypes.number,
    options: React.PropTypes.array,
    allowCustomValues: React.PropTypes.number,
    defaultValue: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    inputProps: React.PropTypes.object,
    onOptionSelected: React.PropTypes.func,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyUp: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    filterOption: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      options: [],
      customClasses: {},
      allowCustomValues: 0,
      defaultValue: "",
      placeholder: "",
      inputProps: {},
      onOptionSelected: function(option) {},
      onChange: function(event) {},
      onKeyDown: function(event) {},
      onKeyUp: function(event) {},
      onFocus: function(event) {},
      onBlur: function(event) {},
      filterOption: null
    };
  },

  getInitialState: function() {
    return {
      // The currently visible set of options
      visible: this.getOptionsForValue(this.props.defaultValue, this.props.options),

      // This should be called something else, "entryValue"
      entryValue: this.props.defaultValue,

      // A valid typeahead value
      selection: null
    };
  },

  getOptionsForValue: function(value, options) {
    var result;
    if (this.props.filterOption) {
      result = options.filter((function(o) { return this.props.filterOption(value, o); }).bind(this));
    } else {
      result = fuzzy.filter(value, options).map(function(res) {
        return res.string;
      });
    }
    if (this.props.maxVisible) {
      result = result.slice(0, this.props.maxVisible);
    }
    return result;
  },

  setEntryText: function(value) {
    this.refs.entry.getDOMNode().value = value;
    this._onTextEntryUpdated();
  },

  _hasCustomValue: function() {
    if (this.props.allowCustomValues > 0 &&
      this.state.entryValue.length >= this.props.allowCustomValues &&
      this.state.visible.indexOf(this.state.entryValue) < 0) {
      return true;
    }
    return false;
  },

  _getCustomValue: function() {
    if (this._hasCustomValue()) {
      return this.state.entryValue;
    }
    return null
  },

  _renderIncrementalSearchResults: function() {
    // Nothing has been entered into the textbox
    if (!this.state.entryValue) {
      return "";
    }

    // Something was just selected
    if (this.state.selection) {
      return "";
    }

    // There are no typeahead / autocomplete suggestions
    if (!this.state.visible.length && !(this.props.allowCustomValues > 0)) {
      return "";
    }

    if (this._hasCustomValue()) {
      return (
        React.createElement(TypeaheadSelector, {
          ref: "sel", options: this.state.visible, 
          customValue: this.state.entryValue, 
          onOptionSelected: this._onOptionSelected, 
          customClasses: this.props.customClasses})
      );
    }

    return (
      React.createElement(TypeaheadSelector, {
        ref: "sel", options:  this.state.visible, 
        onOptionSelected:  this._onOptionSelected, 
        customClasses: this.props.customClasses})
   );
  },

  _onOptionSelected: function(option, event) {
    var nEntry = this.refs.entry.getDOMNode();
    nEntry.focus();
    nEntry.value = option;
    this.setState({visible: this.getOptionsForValue(option, this.props.options),
                   selection: option,
                   entryValue: option});
    return this.props.onOptionSelected(option, event);
  },

  _onTextEntryUpdated: function() {
    var value = this.refs.entry.getDOMNode().value.toLowerCase();
    this.setState({visible: this.getOptionsForValue(value, this.props.options),
                   selection: null,
                   entryValue: value});
  },

  _onEnter: function(event) {
    //something selected in the typeahead
    if (!!this.refs.sel && this.refs.sel.state.selection) {
      this._onOptionSelected(this.refs.sel.state.selection);
    }
    //something is typed in the input
    else if(this.state.entryValue) {
      this._onOptionSelected(this.state.entryValue);
      this.props.onKeyDown(event);
    }
    //neither the typeahead has a selection nor an input value exists
    else {
      return this.props.onKeyDown(event);
    }
  },

  _onEscape: function() {
    this.props.onBlur();
  },

  //If tab, just use the first entry in the typeaheads suggestions
  _onTab: function(event) {
    var option = this.refs.sel.state.selection ?
      this.refs.sel.state.selection : (this.state.visible.length > 0 ? this.state.visible[0] : null);

    if (option === null && this._hasCustomValue()) {
      option = this._getCustomValue();
    }

    if (option !== null) {
      return this._onOptionSelected(option, event);
    }
  },

  eventMap: function(event) {
    var events = {};

    if (!!this.refs.sel) {
      events[KeyEvent.DOM_VK_DOWN] = this.refs.sel.navDown;
      events[KeyEvent.DOM_VK_UP] = this.refs.sel.navUp;
    }
    events[KeyEvent.DOM_VK_RETURN] = events[KeyEvent.DOM_VK_ENTER] = this._onEnter;
    events[KeyEvent.DOM_VK_ESCAPE] = this._onEscape;
    events[KeyEvent.DOM_VK_TAB] = this._onTab;

    return events;
  },

  _onChange: function(event) {
    if (this.props.onChange) {
      this.props.onChange(event);
    }

    this._onTextEntryUpdated();
  },

  _onKeyDown: function(event) {

    var handler = this.eventMap()[event.keyCode];


    if (handler) {
      handler(event);
    } else {
      return this.props.onKeyDown(event);
    }
    // Don't propagate the keystroke back to the DOM/browser
    event.preventDefault();
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({
      visible: this.getOptionsForValue(this.state.entryValue, nextProps.options)
    });
  },

  render: function() {
    var inputClasses = {}
    inputClasses[this.props.customClasses.input] = !!this.props.customClasses.input;
    var inputClassList = classNames(inputClasses);

    var classes = {
      typeahead: true
    }
    classes[this.props.className] = !!this.props.className;
    var classList = classNames(classes);

    return (
      React.createElement("div", {className: classList}, 
         this._renderHiddenInput(), 
        React.createElement("input", React.__spread({ref: "entry", type: "text"}, 
          this.props.inputProps, 
          {placeholder: this.props.placeholder, 
          className: inputClassList, 
          value: this.state.entryValue, 
          defaultValue: this.props.defaultValue, 
          onChange: this._onChange, 
          onKeyDown: this._onKeyDown, 
          onKeyUp: this.props.onKeyUp, 
          onFocus: this.props.onFocus, 
          onBlur: this.props.onBlur})
        ), 
         this._renderIncrementalSearchResults() 
      )
    );
  },

  _renderHiddenInput: function() {
    if (!this.props.name) {
      return null;
    }

    return (
      React.createElement("input", {
        type: "hidden", 
        name:  this.props.name, 
        value:  this.state.selection}
      )
    );
  }
});

module.exports = Typeahead;
