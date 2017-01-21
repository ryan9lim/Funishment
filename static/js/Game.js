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
    this.dealCards = this.dealCards.bind(this);
    this.updateOnListener = this.updateOnListener.bind(this);
    this.state = {
      deck: ['DECK NOT INIITIALIZED'], 
      handDealt: false,
      discard: [],
      hand: ['test1', 'test2', 'test3','test4','test5']
    }
    this.gameChannel = 'gameChannel01'
  }
  /*
   * Callback of element initialization
   */
  componentWillMount(){
    this.props.pubnubDemo.setState({
      state: {
        "host": this.props.isHost,
      },
      channels: [this.channelName, this.gameChannel]
    });
    this.props.pubnubDemo.addListener({
      message: this.updateOnListener
    });
    this.props.pubnubDemo.subscribe({
      channels: [this.gameChannel]
    });
  }
  updateOnListener(response) {
    if (response.message.dealing) {
      var indexInUsers = -1;
      var i;
      for (i = 0; i < response.message.usersPlaying.length; i++) {
        if(response.message.usersPlaying[i] == this.props.pubnubDemo.getUUID()) {
          indexInUsers = i;
          break;
        }
      }

      console.log("current user has index in array of ", indexInUsers);
      console.log("array of users is ", response.message.usersPlaying);
      console.log("size of array of users is ", response.message.usersPlaying.length);
    
      if (indexInUsers == response.message.nextToDraw) {
        var han = response.message.deck.slice(0,5);
        var deq = response.message.deck.slice(5);

        if (response.message.nextToDraw + 1 < response.message.usersPlaying.length) {
          this.props.pubnubDemo.publish({
            message: {
              dealing: true,
              nextToDraw: response.message.nextToDraw+1,
              deck: deq,
              usersPlaying: response.message.usersPlaying
            },
            channel: this.props.gameChannel
          });
        } else {
          this.props.pubnubDemo.publish({
            message: {
              dealing: false,
              fixDeckAfterDeal: true,
              deck: deq
            },
            channel: this.props.gameChannel
          });
        }

        this.setState({
          handDealt: true,
          deck: deq,
          hand: han
        });
      }
    } else if (response.message.fixDeckAfterDeal){
      this.setState({
        deck: response.message.deck
      });
    }
  }
  dealCards() {
    var deq = this.shuffle([
      'AC', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC',
      'AD', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD',
      'AH', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH',
      'AS', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS'
    ]);
    this.props.pubnubDemo.publish({
      message: {
        dealing: true,
        nextToDraw: 0,
        deck: deq,
        usersPlaying: this.props.usersPlaying
      },
      channel: this.gameChannel
    });
  }
  /*
   * Shuffle function sourced from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    
    }

    return array;
  }
  render() {
    return (
      <div className='Game' style={{display: (this.props.gameStarted ? "block" : "none")}}>
        <button type="button"
          onClick={this.dealCards}
          className='btn btn-lg btn-default'>
          Deal
        </button>

        <div id='deck'>
          Deck Cards Left: {this.state.deck.length}
        </div>

        <div id='deckCards'>
          Deck Cards: {this.state.deck}
        </div>

        <div id='discard'>
          Discard Pile Size: {this.state.discard.length}
        </div>

        <div id='discardCards'>
          Discard Cards: {this.state.discard}
        </div>

        <div id='hand'>
          <div className='col-md-2'>  {this.state.hand[0]}  </div>
          <div className='col-md-2'>  {this.state.hand[1]}  </div>
          <div className='col-md-2'>  {this.state.hand[2]}  </div>
          <div className='col-md-2'>  {this.state.hand[3]}  </div>
          <div className='col-md-2'>  {this.state.hand[4]}  </div>
          <div className='col-md-2'>  DRAWN CARD  </div>
        </div>
      </div>
    )
  }
}

module.exports = Game;