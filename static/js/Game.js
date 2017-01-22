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
    this.yusef = this.yusef.bind(this);
    this.dealCards = this.dealCards.bind(this);
    this.updateOnListener = this.updateOnListener.bind(this);
    this.state = {
      deck: ['DECK NOT INIITIALIZED'], 
      handDealt: false,
      discard: [],
      hand: ['empty', 'empty', 'empty','empty','empty'],
      callStatus: 0 // 1 is you win, -1 is you lose, 2 is someone else won, -2 is someone else lost
    }
    this.gameChannel = 'gameChannel0011'
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
      for (i = 0; i < this.props.usersPlaying.length; i++) {
        if(this.props.usersPlaying[i] == this.props.pubnubDemo.getUUID()) {
          indexInUsers = i;
          break;
        }
      }

      console.log("current user has index in array of ", indexInUsers);
      console.log("array of users is ", this.props.usersPlaying);
      console.log("size of array of users is ", this.props.usersPlaying.length);
    
      if (indexInUsers == response.message.nextToDraw) {
        var han = response.message.deck.slice(0,5);
        var deq = response.message.deck.slice(5);

        if (response.message.nextToDraw + 1 < this.props.usersPlaying.length) {
          this.props.pubnubDemo.publish({
            message: {
              dealing: true,
              nextToDraw: response.message.nextToDraw+1,
              deck: deq
            },
            channel: this.gameChannel
          });
        } else {
          this.props.pubnubDemo.publish({
            message: {
              dealing: false,
              fixDeckAfterDeal: true,
              deck: deq
            },
            channel: this.gameChannel
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
    } else if (response.message.checkingYusef) {
      if(response.message.nextToCheck >= this.props.usersPlaying.length && response.message.callerId == this.props.pubnubDemo.getUUID()) {
        var pf;
        if (response.message.failed) {
          pf = -1;
        } else {
          pf = 1;
        }

        console.log("check came back around and the result was ", pf);

        this.setState({
          callStatus: pf,
        });
      } else {
        var indexInUsers = -1;
        var i;
        for (i = 0; i < this.props.usersPlaying.length; i++) {
          if(this.props.usersPlaying[i] == this.props.pubnubDemo.getUUID()) {
            indexInUsers = i;
            break;
          }
        }

        if(indexInUsers == response.message.nextToCheck) {
          console.log("checked yusef. their call was ", response.message.count, " and mine was ", this.summ(this.state.hand));
          var fail = response.message.failed;
          if (!response.message.failed && response.message.callerId != this.props.pubnubDemo.getUUID() && response.message.count >= this.summ(this.state.hand)) {
            fail = true;
          }

          console.log("fail is", fail);
          this.props.pubnubDemo.publish({
            message: {
              dealing: false,
              fixDeckAfterDeal: false,
              checkingYusef: true,
              nextToCheck: response.message.nextToCheck + 1,
              callerId: response.message.callerId,
              count: response.message.count,
              failed: fail
            },
            channel: this.gameChannel
          });
        }
      }
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
        deck: deq
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
  yusef() {
    var myCount = this.summ(this.state.hand);
    console.log("called yusef with hand of value ", myCount);
    this.props.pubnubDemo.publish({
      message: {
        dealing: false,
        fixDeckAfterDeal: false,
        checkingYusef: true,
        nextToCheck: 0,
        callerId: this.props.pubnubDemo.getUUID(),
        count: myCount,
        failed: false
      },
      channel: this.gameChannel
    });
  }
  summ(arr) {
    var count = 0;
    var i;
    console.log(this.state.hand);
    for(i = 0; i < this.state.hand.length && this.state.hand[i] != "empty"; i++) {
      if(this.state.hand[i].charCodeAt(0) <= "9".charCodeAt(0) && this.state.hand[i].charCodeAt(0) >= "2".charCodeAt(0)) {
        count += this.state.hand[i].charCodeAt(0) - "0".charCodeAt(0);
      } else if (this.state.hand[i].slice(0,1) == "A"){
        count += 1;
      } else {
        count += 10;
      }
    }
    console.log(count);
    return count;
  }
  render() {
    return (
      <div className='Game' style={{display: (this.props.gameStarted ? "block" : "none")}}>
        <button type="button"
          onClick={this.dealCards}
          className='btn btn-lg btn-default'>
          Deal
        </button>

        <div id='deck' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          Deck Cards Left: {this.state.deck.length}
        </div>

        <div id='deckCards' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          Deck Cards: {this.state.deck}
        </div>

        <div id='discard' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          Discard Pile Size: {this.state.discard.length}
        </div>

        <div id='discardCards' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          Discard Cards: {this.state.discard}
        </div>

        <div id='hand' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          <div className='col-md-2'>  Card 1: {this.state.hand[0]}  </div>
          <div className='col-md-2'>  Card 2: {this.state.hand[1]}  </div>
          <div className='col-md-2'>  Card 3: {this.state.hand[2]}  </div>
          <div className='col-md-2'>  Card 4: {this.state.hand[3]}  </div>
          <div className='col-md-2'>  Card 5: {this.state.hand[4]}  </div>
          <div className='col-md-2'>  DRAWN CARD  </div>
        </div>

        <button type="button"
          onClick={this.yusef}
          className='btn btn-lg btn-default'
          style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          YUSEF!
        </button>

        <div id='passCall' style={{display: ((this.state.callStatus == 1) ? "block" : "none")}}>
          Your Call Passed!
        </div>

        <div id='failCall' style={{display: ((this.state.callStatus == -1) ? "block" : "none")}}>
          Your Call Failed!
        </div>
      </div>
    )
  }
}

module.exports = Game;