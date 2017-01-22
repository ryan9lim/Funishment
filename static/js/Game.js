import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';

{/*
  Props available to Game:

  - gameStarted (boolean)
  - isHost (boolean)
  - usersPlaying (array)
  - pubnubDemo (Pubnub Object)
  - channelName (string)
*/}

/*
 * Class for the Game aspect of the app
 */
class Game extends React.Component {
  constructor(props) {
    super(props);

    // Bind this to all of the necessary methods
    this.yusef = this.yusef.bind(this);
    this.drawFromDeck = this.drawFromDeck.bind(this);
    this.drawFromDiscard = this.drawFromDiscard.bind(this);
    this.checkValidPlay = this.checkValidPlay.bind(this);
    this.select = this.select.bind(this);
    this.playCards = this.playCards.bind(this);
    this.playHand = this.playHand.bind(this);
    this.dealCards = this.dealCards.bind(this);
    this.lose = this.lose.bind(this);
    this.updateOnListener = this.updateOnListener.bind(this);

    // Initialize the state of Game
    this.state = {
      deck: ['DECK NOT INIITIALIZED'], // Deck to be drawn from
      handDealt: false, // The current player's hand is dealt
      discard: [], // Discard Pile
      hand: [], // Current Player's hand
      callStatus: 0, // 1 is you win, -1 is you lose, 2 is someone else won, -2 is someone else lost
      turn: 0, // Whose turn it is
      chosenCards: '', // Cards that have been chosen to be discarded
      isTurn: false, // Whether it is the current player's turn
      canDeal: true, // If the 'deal' button can currently be used
      playing: false, // Whether we are currently playing (finished the setup of the game)
      cardToAdd: '', // Which card being drawn and added to hand
      hasDrawn: false, // Completed draw phase of turn
      lastPlay: [], // Set of last few cards being played
      points: 0 // Current player's point total
    }

    // Channel for the game data to be sent on
    this.gameChannel = this.props.channelName + 'gameChannel';
  }

  /*
   * Callback of element initialization
   */
  componentWillMount(){
    // Set the state of the pubnub demo of parent (host status and open channels)
    this.props.pubnubDemo.setState({
      state: {
        "host": this.props.isHost,
      },
      channels: [this.channelName, this.gameChannel]
    });

    // Add a listener for messages sent using parent's pubnubdemo
    this.props.pubnubDemo.addListener({
      message: this.updateOnListener
    });

    // Subscribe to the game channel
    this.props.pubnubDemo.subscribe({
      channels: [this.gameChannel]
    });
  }

  /*
   * Get the index of the current user in the global array of users playing
   */
  getUserIndex(){
    var i;

    // For each user, check if UUID matches id in the usersPlaying array
    for (i = 0; i < this.props.usersPlaying.length; i++) {
      if(this.props.usersPlaying[i] == this.props.pubnubDemo.getUUID()) {
        return i;
        break;
      }
    }
    return -1;
  }

  /*
   * Callback of listener when packets sent regarding the game
   */
  updateOnListener(response) {
    // Updates deck
    if (response.message.deck != null) {
      console.log("size of deck is ", response.message.deck.length);
      this.setState({
        deck: response.message.deck
      });
    }

    // Updates discard and lastPlay
    if (response.message.discard != null) {
      console.log("size of discard is ", response.message.discard.length);
      this.setState({
        discard: response.message.discard,
        lastPlay: response.message.lastPlay
      });

      // player played card, update allHands
      if(response.message.playing){
        var index = (response.message.turn - 1+ this.props.usersPlaying.length)%this.props.usersPlaying.length;
        this.state.allHands[index] += 1 - response.message.lastPlay.length;
        console.log(this.state.allHands)
      }
    }

    // In playing phase of turn
    if (response.message.playing && response.message.turn != null) {
      // Update own tracking of whose turn it is
      this.setState({
        turn: response.message.turn
      });

      console.log("changing turns to " + response.message.turn.toString());

      // If it is my turn, play hand
      var indexInUsers = this.getUserIndex()
      if (indexInUsers == response.message.turn) {
        console.log("it is my turn");
        this.playHand();
      } else {
        console.log(this.props.usersPlaying[response.message.turn] + " turn to play!")
      }
    } else if (response.message.dealing) {
      // In dealing phase of turn
      var indexInUsers = this.getUserIndex()

      console.log("current user has index in array of ", indexInUsers, "and nextToDraw is", response.message.nextToDraw);
      console.log("array of users is ", this.props.usersPlaying);
      console.log("size of array of users is ", this.props.usersPlaying.length);
    
      // It is the current player's turn to draw
      if (indexInUsers == response.message.nextToDraw) {
        var han = response.message.deck.slice(0,5); // Drawn Hand
        var deq = response.message.deck.slice(5); // Remaining deck after draw

        // If more people need to draw after, propagate the draw packet
        // Otherwise, tell the originator to begin playing
        if (response.message.nextToDraw + 1 < this.props.usersPlaying.length) {
          // More people need to draw
          this.props.pubnubDemo.publish({
            message: {
              dealing: true,
              nextToDraw: response.message.nextToDraw+1,
              deck: deq
            },
            channel: this.gameChannel
          });
        } else {
          // Drawing is finished and now playing begins
          console.log("finished dealing!")
          this.props.pubnubDemo.publish({
            message: {
              dealing: false,
              playing: true,
              turn: this.state.turn,
              deck: deq
            },
            channel: this.gameChannel
          });

        }

        console.log("I AM UPDATING ON DEAL");

        // Set own state to reflect the cards I just drew
        this.setState({
          discard: [],
          deck: deq,
          hand: han,
          canDeal: false,
          callStatus: 0 // 1 is you win, -1 is you lose, 2 is someone else won, -2 is someone else lost
        });

        // everyone starts off with 5 cards
        var arraySize = this.props.usersPlaying.length
        while(arraySize--) this.state.allHands.push(5);
      }
    } else if (response.message.checkingYusef) {
      // In the stage of checking a Yusef call
      
      if(response.message.nextToCheck >= this.props.usersPlaying.length && response.message.callerId == this.props.pubnubDemo.getUUID()) {
        // All others have checked Yusef call
        var pf;
        if (response.message.failed) {
          // Failed
          // Call status will change to -1 for this user and -2 for others
          pf = -1;
        } else {
          // Passed
          // Call status will change to 1 for this user and 2 for others
          pf = 1;
        }

        console.log("check came back around and the result was ", pf);

        // Publish packet to finalize each user's view based on the result of the yusef call
        this.props.pubnubDemo.publish({
          message: {
            dealing: false,
            checkingYusef: false,
            confirmingYusef: true,
            callerId: this.props.pubnubDemo.getUUID(),
            callStatus: pf
          },
          channel: this.gameChannel
        });
      } else {
        // Current user still needs to check if the Yusef call was a success
        
        // Determine current user's index in the array of usersPlaying
        var indexInUsers = -1;
        var i;
        for (i = 0; i < this.props.usersPlaying.length; i++) {
          if(this.props.usersPlaying[i] == this.props.pubnubDemo.getUUID()) {
            indexInUsers = i;
            break;
          }
        }

        // If current user is the next to check, check the Yusef call
        if(indexInUsers == response.message.nextToCheck) {

          console.log("checked yusef. their call was ", response.message.count, " and mine was ", this.summ(this.state.hand));
          
          var fail = response.message.failed;

          // If the caller hadn't previously failed, but the current user is a separate user with a lower score, fail
          if (!response.message.failed && response.message.callerId != this.props.pubnubDemo.getUUID() && response.message.count >= this.summ(this.state.hand)) {
            fail = true;
          }

          console.log("fail is", fail);

          // Publish packet propagating the success or failure to the next person to check
          this.props.pubnubDemo.publish({
            message: {
              dealing: false,
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
    } else if (response.message.confirmingYusef) {
      // We are in the phase of updating the user views after a Yusef call has been checked
      var stat; // The call status to update
      var pointsToAdd; // Number of points to add to score

      // Check the message callStatus and assign the correct number of points and status code
      if(response.message.callStatus > 0) {
        if (response.message.callerId == this.props.pubnubDemo.getUUID()) {
          pointsToAdd = 0;
          stat = 1;
        } else {
          pointsToAdd = this.summ(this.state.hand);
          stat = 2;
        }
      } else {
        if (response.message.callerId == this.props.pubnubDemo.getUUID()) {
          pointsToAdd = 30;
          stat = -1;
        } else {
          pointsToAdd = 0;
          stat = -2;
        }
      }

      // Change current user's state with regard to callstatus, visibility of deal and points
      this.setState({
        callStatus: stat,
        canDeal: true,
        points: this.state.points + pointsToAdd
      });

      // Check if the current user has lost the game
      if(this.state.points >= 200){
        this.lose();
      }
    }
  }

  /*
   * Function to deal with loss / end of game
   */
  lose(){
    console.log("YOU LOST");
  }

  /*
   * Callback handler for selecting a card to be played
   */
  select(index) {
    console.log("selected", index, "for playing");
    this.setState({
      chosenCards: this.state.chosenCards + index.toString()
    });
  }

  /*
   * Callback handler for playing the set of selected cards
   */
  playCards(){
    console.log("in playcards, this is", this);
    console.log("and chosenCards is", this.state.chosenCards);

    // Determine which of the cards in the hand to play
    var played = [false, false, false, false, false];
    var i;
    for (i = 0; i < this.state.chosenCards.length; i++) {
      played[parseInt(this.state.chosenCards.slice(i,i+1))] = !played[parseInt(this.state.chosenCards.slice(i,i+1))];
    }
    var lastPla = []; // The new "last-played hand"

    // If the play is valid, update the user's information and propagate the change to public info
    // Otherwise, kill the play and wait for a valid play
    if(this.checkValidPlay(played, this.state.hand)) {
      // Play valid
      
      var newDiscard = this.state.discard; // New discard pile after play
      var newHand = this.state.hand; // New hand after play

      // Determine the new "last play", discard, and hand based on the boolean array and hand
      for (i = 4; i >= 0; i -= 1) {
        if (played[i]) {
          lastPla.unshift(this.state.hand[i]);
          newDiscard.unshift(this.state.hand[i]);
          newHand.splice(i, 1);
        }
      }
      
      // Add the drawn card to the hand (after we discard the other cards)
      newHand.push(this.state.cardToAdd);

      console.log("current turn is", this.state.turn, "...finished playing and about to change turn to", (this.state.turn+1) % this.props.usersPlaying.length);
      
      // Publish a packet to the other users with the new turn, discard pile, and last play
      this.props.pubnubDemo.publish({
        message: {
          playing: true,
          turn: (this.state.turn+1) % this.props.usersPlaying.length,
          discard: newDiscard,
          lastPlay: lastPla
        },
        channel: this.gameChannel
      });

      // Change own state as needed
      this.setState({
        hand: newHand,
        isTurn: false,
        chosenCards: '',
        cardToAdd: '',
        hasDrawn: false
      });
    } else {
      // Play invalid, clear the chosen cards
      this.setState({
        chosenCards: ''
      });
    }
  }

  /*
   * Check whether the subset of the hand denoted by bools is valid
   */
  checkValidPlay(bools, hand) {
    var nums = []; // Numerical values of cards
    var suits = []; // Suit values of cards

    // Determine the numbers and suits from the hand
    var i;
    for (i = 0; i < bools.length; i++) {
      if (bools[i]) {
        if(hand[i].length == 2) {
          nums.push(hand[i].slice(0,1));
          suits.push(hand[i].slice(1));
        } else {
          nums.push(hand[i].slice(0,2));
          suits.push(hand[i].slice(2));
        }
      }
    }

    console.log("nums is", nums);
    console.log("suits is", suits);

    // If we are just playing one card, it is valid
    if (nums.length == 1) {
      return true;
    }

    // If we are playing less than one card, it is invalid
    if (nums.length < 1) {
      return false;
    }

    var allSame = true; // Whether all numbers or suits are the same
    var firstNum = nums[0]; // First card's numerical value
    var firstSuit = suits[0]; // First card's suit valud

    // Check if all numbers are the same
    for (i = 0; i < nums.length; i++) {
      if (nums[i] != firstNum) {
        allSame = false;
        break;
      }
    }

    // All numbers are the same, so hand is valid
    if (allSame) {
      return true;
    }

    // Reinitialize allsame for check of straights
    allSame = true;

    // Check for straights
    for (i = 0; i < suits.length; i++) {
      if (suits[i] != firstSuit) {
        allSame = false;
        break;
      }
    }

    // Array of valid sorted straights
    var straights = [
      ["2", "3", "A"],
      ["2", "3", "4"],
      ["3", "4", "5"],
      ["4", "5", "6"],
      ["5", "6", "7"],
      ["6", "7", "8"],
      ["7", "8", "9"],
      ["10", "8", "9"],
      ["10", "9", "J"],
      ["10", "J", "Q"],
      ["J", "K", "Q"],
      ["2", "3", "4", "A"],
      ["2", "3", "4", "5"],
      ["3", "4", "5", "6"],
      ["4", "5", "6", "7"],
      ["5", "6", "7", "8"],
      ["6", "7", "8", "9"],
      ["10", "7", "8", "9"],
      ["10", "8", "9", "J"],
      ["10", "9", "J", "Q"],
      ["10", "J", "K", "Q"],
      ["2", "3", "4", "5", "A"],
      ["2", "3", "4", "5", "6"],
      ["3", "4", "5", "6", "7"],
      ["4", "5", "6", "7", "8"],
      ["5", "6", "7", "8", "9"],
      ["10", "6", "7", "8", "9"],
      ["10", "7", "8", "9", "J"],
      ["10", "8", "9", "J", "Q"],
      ["10", "9", "J", "K", "Q"]
    ];

    // Sort the numerical values of the cards lexicographically
    nums.sort();

    // All the same suit so check values
    if (allSame) {
      for(i = 0; i < straights.length; i++) {
        if(this.arraysEqual(straights[i],nums)) {
          return true;
        }
      }
    }

    console.log("nums was not what we wanted. it was", nums);
    console.log("or suits was not what we wanted. it was", suits);

    // If not a straight, not all numbers are the same, and there are multiple cards chosen, invalid
    return false;
  }

  /*
   * Check if two arrays have equivalent entries
   * Sourced from http://stackoverflow.com/questions/4025893/how-to-check-identical-array-in-most-efficient-way
   */
  arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
  }

  /*
   * Callback handler for button that deals cards
   */
  dealCards() {
    // Initialize the deck as a shuffled version of all valid cards
    var deq = this.shuffle([
      'AC', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC',
      'AD', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD',
      'AH', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH',
      'AS', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS'
    ]);

    // Publish packet with deck for the sake of dealing starting hands
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
   * Shuffle an array
   * Sourced from http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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

  /*
   * Draw a card from the deck
   */
  drawFromDeck() {
    var card = this.state.deck[0];
    this.setState({
      deck: this.state.deck.slice(1)
    });
    var indexInUsers = this.getUserIndex();
    
    this.setState({
      cardToAdd: card,
      hasDrawn: true
    })

    // update deck
    if (this.state.deck.length > 1) {
      // deck still valid
      this.props.pubnubDemo.publish({
        message: {
          deck: this.state.deck.slice(1)
        },
        channel: this.gameChannel
      });
    } else {
      // deck out and need to reshuffle discard into it
      var newDeck = this.shuffle(this.state.discard.slice(1));
      this.props.pubnubDemo.publish({
        message: {
          deck: newDeck,
          discard: this.state.discard.slice(0,1),
          lastPlay: this.state.lastPlay
        },
        channel: this.gameChannel
      }); 
    }
  }

  drawFromDiscard() {
    var card = this.state.discard.shift()
    var indexInUsers = this.getUserIndex();
    this.setState({
      cardToAdd: card,
      hasDrawn: true
    })

    // update discard
    this.props.pubnubDemo.publish({
      message: {
        discard: this.state.discard,
        lastPlay: this.state.lastPlay
      },
      channel: this.gameChannel
    });
  }
  playHand(){
    console.log("My turn to play!")
      this.setState({
        isTurn: true
      });
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
    for(i = 0; i < this.state.hand.length; i++) {
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
          className='btn btn-lg btn-default'
          style={{display: (this.state.canDeal ? "block" : "none")}}>
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

        <div id='lastPlay' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          Last Play: {this.state.lastPlay}
        </div>

        <div id='topCard' style={{display: ((this.state.callStatus == 0) ? "block" : "none")}}>
          Top Card of Discard Pile: {(this.state.lastPlay.length > 0) ? this.state.lastPlay[0] : ''}
        </div>
        <br />
        <div>
          {this.state.allHands.map((name, index) => 
            (<div className='col-md-2' style={{display: ((index != this.getUserIndex()) ? "block" : "none")}}>Player {index+1} : Cards {this.state.allHands[index]}  </div>)
          )}
        </div>
        <br />

        <div id='points'>
          Total Points: {this.state.points}
        </div>

        <div style={{display: ((!this.state.canDeal) ? "block" : "none")}}>
          <button className='col-md-4' style={{display: ((this.state.callStatus == 0 && this.state.isTurn && !this.state.hasDrawn) ? "block" : "none")}} onClick={this.drawFromDeck}>  DRAW A CARD FROM DECK </button>
          <button className='col-md-4' style={{display: ((this.state.callStatus == 0 && this.state.isTurn && !this.state.hasDrawn && this.state.discard.length > 0) ? "block" : "none")}} onClick={this.drawFromDiscard}>  DRAW A CARD FROM DISCARD </button>
          <div className='col-md-4'></div>
          <br />
          <div id='hand' style={{display: ((this.state.callStatus == 0 && !(this.state.isTurn && this.state.hasDrawn)) ? "block" : "none")}}>
            {this.state.hand.map((name, index) => 
                (<div className='col-md-2'>  Card {index+1}: {this.state.hand[index]}  </div>)
            )}
          </div>
          <br />
          <div id='hand' style={{display: ((this.state.callStatus == 0 && this.state.isTurn && this.state.hasDrawn) ? "block" : "none")}}>
            {this.state.hand.map((name, index) => 
                (<button className='col-md-2' onClick={this.select.bind(this,index)}>  Card {index+1}: {this.state.hand[index]}  </button>)
            )}
            <button className='col-md-2' onClick={this.playCards}>  SUBMIT CHOICES </button>
          </div>

          <button type="button"
            onClick={this.yusef}
            className='btn btn-lg btn-default'
            style={{display: ((this.state.callStatus == 0 && this.state.isTurn && !this.state.hasDrawn) ? "block" : "none")}}>
            YUSEF!
          </button>
        </div>

        <div id='passCall' style={{display: ((this.state.callStatus == 1) ? "block" : "none")}}>
          Your Call Passed!
        </div>

        <div id='failCall' style={{display: ((this.state.callStatus == -1) ? "block" : "none")}}>
          Your Call Failed!
        </div>

        <div id='passCall' style={{display: ((this.state.callStatus == 2) ? "block" : "none")}}>
          Another Players Call Passed!
        </div>

        <div id='failCall' style={{display: ((this.state.callStatus == -2) ? "block" : "none")}}>
          Another Players Call Failed!
        </div>
      </div>
    )
  }
}

module.exports = Game;