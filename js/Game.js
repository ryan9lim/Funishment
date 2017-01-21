import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';

{/*
  Props available to Game:

  - gameStarted (boolean)
*/}

class Game extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className='Game' style={{display: (this.props.gameStarted ? "block" : "none")}}>
        TEST THIS SHOULD BE INVISIBLE
      </div>
    )
  }
}

module.exports = Game;