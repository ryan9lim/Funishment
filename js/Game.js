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
    this.state = {
      deck: [
        'AC', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC',
        'AD', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD',
        'AH', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH',
        'AS', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS'
      ]
    }
  }
  render() {
    return (
      <div className='Game' style={{display: (this.props.gameStarted ? "block" : "none")}}>
        TEST THIS SHOULD BE INVISIBLE UNTIL START

        <div id='deck'>
          Deck Cards Left: {this.state.deck.length}
        </div>
      </div>
    )
  }
}

module.exports = Game;