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
      <div className='Game'>
      </div>
    )
  }
}

module.exports = Game;