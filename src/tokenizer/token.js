/**
 * @jsx React.DOM
 */

var React = require('react');
var classNames = require('classnames');

/**
 * Encapsulates the rendering of an option that has been "selected" in a
 * TypeaheadTokenizer
 */
var Token = React.createClass({
  propTypes: {
    name: React.PropTypes.string,
    isPermanent: React.PropTypes.bool,
    isSuggested: React.PropTypes.bool,
    className: React.PropTypes.string,
    children: React.PropTypes.string,
    onRemove: React.PropTypes.func,
    onApprove: React.PropTypes.func,
    onDisapprove: React.PropTypes.func,
  },

  getDefaultProps: function() {
    return {
      onApprove: function() {},
      onDisapprove: function() {},
    };
  },

  render: function() {
    var actions;
    if (!this.props.isPermanent && !this.props.isSuggested){
      actions = this._renderCloseButton();
    } else if (this.props.isSuggested) {
      actions = this._renderSuggestedConfirmation();
    }

    var className = classNames(
      "typeahead-token",
      this._isSpecialTag(this.props.name),
      this.props.className
    );

    return (
      <div className={className}>
        {this._renderHiddenInput()}
        {this.props.name}
        {actions}
      </div>
    );
  },

  _isSpecialTag: function(name) {
    if (name.indexOf("@") > -1) {
      return "mention ";
    }
    else if (name.indexOf("#") > -1) {
      return "hashtag ";
    }
    return "";
  },

  _renderHiddenInput: function() {
    // If no name was set, don't create a hidden input
    if (!this.props.name) {
      return null;
    }

    return (
      <input
        type="hidden"
        name={ this.props.name + '[]' }
        value={ this.props.children }
      />
    );
  },

  _renderSuggestedConfirmation: function() {
    return (
      <span className="typeahead-token-controls">
        <a className="typeahead-token-check" href="#" onClick={function(event) {
            event.preventDefault();
            this.props.onApprove(this.props.name);
          }.bind(this)}><i className="fa fa-check"/></a>
        <a className="typeahead-token-close" href="#" onClick={function(event) {
            event.preventDefault();
            this.props.onDisapprove(this.props.name);
          }.bind(this)}><i className="fa fa-times"/></a>
      </span>
    );
  },

  _renderCloseButton: function() {
    if (!this.props.onRemove) {
      return "";
    }
    return (
      <span className="typeahead-token-controls">
        <a className="typeahead-token-close" href="#" onClick={function(event) {
          event.preventDefault();
          this.props.onRemove(this.props.name);
        }.bind(this)}><i className="fa fa-times"/></a>
      </span>
    );
  }

});

module.exports = Token;
