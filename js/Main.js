import Hello from './Hello';
import React from 'react';
import ReactDOM from 'react-dom';

class Main extends React.Component{
  constructor(props) {
    super(props);
    this.clickButton = this.clickButton.bind{this};
  }
  clickButton() {
      var random = Math.floor(Math.random * 2);
      if (random == 0) {
        // Post to friend's Twitter
      } else {
        // Friend posts to your Twitter
      }
  }
  render() {
    return (
      <button type="button"
              onclick={this.clickButton}
              className='btn btn-lg btn-default'>
        Click on button
      </button>
    )
  }
}

module.exports = Main;