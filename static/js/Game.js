import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Axios from 'axios';

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
    this.postTwitter = this.postTwitter.bind(this);
    this.shouldHide = this.shouldHide.bind(this);
    this.shouldSelect = this.shouldSelect.bind(this);
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
      points: 0, // Current player's point total
      allHands: [], // Set of number of cards in each player's hands
      turnNumber: 1, // Turn number of current player
      playInvalid: false, // Whether the current attempted play is invalid
      endStatus: 0,
      loserID: '',
      tweet:''
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

    // Someone lost
    if (response.message.lost != null) {
      if(response.message.lost == this.props.pubnubDemo.getUUID()){
        this.setState({
          endStatus: -1
        });
      }
      else{
        this.setState({
          endStatus: 1,
          loserID: response.message.lost
        });
      }
    }
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
      console.log("lastPlay is ", response.message.lastPlay);
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
          turnNumber: 1,
          deck: deq,
          hand: han,
          canDeal: false,
          callStatus: 0, // 1 is you win, -1 is you lose, 2 is someone else won, -2 is someone else lost
          allHands: []
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
      if(this.state.points >= 40){
        this.lose();
      }
    }
  }

  /*
   * Function to deal with loss / end of game
   */
  lose(){
    this.props.pubnubDemo.publish({
      message: {
        lost: this.props.pubnubDemo.getUUID()
      },

      channel: this.gameChannel
    })
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
        playInvalid: false,
        hasDrawn: false,
        turnNumber: this.state.turnNumber + 1
      });
    } else {
      // Play invalid, clear the chosen cards
      this.setState({
        playInvalid: true,
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

    // Take the first card and make it the first discard card
    var disc = [];
    disc.unshift(deq[0]);
    deq = deq.slice(1);

    console.log("initial discard pile is", disc);
    console.log("initial deck is", deq);

    // Publish packet with deck for the sake of dealing starting hands
    this.props.pubnubDemo.publish({
      message: {
        dealing: true,
        nextToDraw: 0,
        deck: deq,
        discard: disc,
        lastPlay: []
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
    var card = this.state.deck[0]; // Top card of deck

    // Update the deck in this user's state
    this.setState({
      deck: this.state.deck.slice(1)
    });

    // Current user's index in the array of usersPlaying
    var indexInUsers = this.getUserIndex();
    
    // Update the card to be added and whether the user has drawn in the user's state
    this.setState({
      cardToAdd: card,
      hasDrawn: true
    })

    // Update the deck
    // If there are cards left, just remove the card
    // If there are no cards left, reshuffle the discard (except top card) back into deck
    if (this.state.deck.length > 1) {
      // Deck still valid
      // Publish a packet with the new deck
      this.props.pubnubDemo.publish({
        message: {
          deck: this.state.deck.slice(1)
        },
        channel: this.gameChannel
      });
    } else {
      // Deck out and need to reshuffle discard into it
      var newDeck = this.shuffle(this.state.discard.slice(1));
      // Publish a packet with the new deck
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

  /*
   * Draw a card from the discard pile
   */
  drawFromDiscard() {
    var card = this.state.discard[0]; // Top card of discard

    // Update the discard in this user's state
    this.setState({
      discard: this.state.discard.slice(1)
    });

    // Current user's index in the array of usersPlaying
    var indexInUsers = this.getUserIndex();
    
    // Update the card to be added and whether the user has drawn in the user's state
    this.setState({
      cardToAdd: card,
      hasDrawn: true
    })

    // Publish packet telling users to update discard and lastPlay
    this.props.pubnubDemo.publish({
      message: {
        discard: this.state.discard.slice(1),
        lastPlay: this.state.lastPlay
      },
      channel: this.gameChannel
    });
  }

  /*
   * Callback handler for playing a hand
   */
  playHand(){
    console.log("My turn to play!")
    // It is the current user's turn
    this.setState({
      isTurn: true
    });
  }

  /*
   * Callback handler for when Yusef is called
   */
  yusef() {
    // Cannot call Yusef until 3rd turn
    if(this.state.turnNumber < 3){
      console.log("Can't call yusef yet!");
      return;
    }
    var myCount = this.summ(this.state.hand); // Determine the score of the current user's hand
    console.log("called yusef with hand of value ", myCount);

    // Publish a packet for other users to check the Yusef call of the current user
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

  /*
   * Determine the score of a hand
   */
  summ(arr) {
    var count = 0; // Initialize the count
    var i;
    console.log(this.state.hand);

    // For each card, add its value to the total count
    for(i = 0; i < this.state.hand.length; i++) {
      if(this.state.hand[i].charCodeAt(0) <= "9".charCodeAt(0) && this.state.hand[i].charCodeAt(0) >= "2".charCodeAt(0)) {
        // Card between 2 and 9
        count += this.state.hand[i].charCodeAt(0) - "0".charCodeAt(0);
      } else if (this.state.hand[i].slice(0,1) == "A"){
        // Card is an Ace
        count += 1;
      } else {
        // Card is a royal (10 J Q K)
        count += 10;
      }
    }

    console.log(count);
    return count;
  }

  postTwitter(event){
    event.preventDefault();
    this.setState({
      tweet: this.refs.inputText.value
    },
    function(response){
      Axios.get('/post_status', {
        params: {
          ID: this.state.loserID,
          message: this.state.tweet
        }
      })
      .then(function (response){
        console.log(response);
      })
      .catch(function (error){
        console.log(error);
      });
      window.location = '/';
    }.bind(this));
  }

    

  /*
   * Gives classnames when something should be hidden
   */
  shouldHide(show_condition) {
    return ClassNames({
      'should-hide': show_condition ? false : true
    })
  }

  /*
   * Gives classnames when something should be selected
   */
  shouldSelect(select_condition, index) {
    let played = false;
    for (let i = 0; i < this.state.chosenCards.length; i++) {
      if(this.state.chosenCards[i] == index.toString())
        played = !played;
    }

    return ClassNames({
      'is-selected': played ? true : false
    })
  }

  /*
   * Translate from code to card in words
   */
  translate(str) {
    var suit;
    switch(str.substring(str.length - 1)) {
      case "C":
        suit = 'Clubs';
        break;
      case "D":
        suit = 'Diamonds';
        break;
      case "H":
        suit = 'Hearts';
        break;
      case "S":
        suit = 'Spades';
        break;
      default:
        suit = 'Questionable Suit';
        break;
    }

    var num;
    switch(str.substring(0,str.length - 1)) {
      case "A":
        num = 'Ace';
        break;
      case "J":
        num = 'Jack';
        break;
      case "Q":
        num = 'Queen';
        break;
      case "K":
        num = 'King';
        break;
      default:
        num = str.slice(0,str.length - 1);
        break;
    }

    return num + ' of ' + suit;
  }

  /*
   * Render the HTML for this React element
   */
  render() {
    return (
      <div className={'Game ' + 
                      this.shouldHide(this.props.gameStarted)}>
        
        {/* Deal Button */}

        <button type="button" onClick={this.dealCards}
          className={'btn btn-lg btn-default ' +
                     this.shouldHide(this.state.canDeal)}>
          Deal
        </button>

        {/* Deck Info */}

        <div id='lastPlay' className={'Label ' + this.shouldHide(this.state.callStatus == 0)}>
          Last Play : {(this.state.lastPlay.length > 0) ? this.state.lastPlay.map(this.translate).join(", ") : ''}
        </div>
        
        <div id='deck' 
             className={'Label ' + this.shouldHide(this.state.callStatus == 0)}>
          Deck Cards Left : {this.state.deck.length}  
        </div>

        <div id='discard' className={'Label ' + this.shouldHide(this.state.callStatus == 0)}>
          Discard Pile Size : {this.state.discard.length}
        </div>

        <div id='topCard' className={'Label ' + this.shouldHide(this.state.callStatus == 0)}>
          Top Card of Discard Pile : <br/> {(this.state.discard.length > 0) ? this.translate(this.state.discard[0]) : ''}
        </div>
        <div>
          {Array(this.props.usersPlaying ? this.props.usersPlaying.length : 0).fill(" ").map((name, index) => 
            (<div className='Label' style={{display: ((index != this.getUserIndex()) ? "block" : "none")}}>Player {index+1}: {this.state.allHands ? this.state.allHands[index] : 0} Cards left </div>)
          )}
        </div>
        <div id='whoseTurn' className="Label">
          Current Turn : {'Player ' + (this.state.turn + 1).toString()}
        </div>

        <div id='points' className="scoreboard">
          Total Points : {this.state.points}
        </div>




        {/* Draw Buttons */}

        <button className={'draw-button ' + this.shouldHide((this.state.callStatus == 0 && this.state.isTurn && !this.state.hasDrawn))} 
                onClick={this.drawFromDeck}>  
          Draw from Deck 
        </button>

        <button className={'draw-button ' + this.shouldHide((this.state.callStatus == 0 && this.state.isTurn && !this.state.hasDrawn  && this.state.discard.length > 0))} 
                onClick={this.drawFromDiscard}>  
          Draw from Discarded Pile 
        </button>

          {/*<div id='hand' style={{display: ((this.state.callStatus == 0 && !(this.state.isTurn && this.state.hasDrawn)) ? "block" : "none")}}>
            {this.state.hand.map((name, index) => 
                (<div className='card'>  Card {index+1}: {this.state.hand[index]}  </div>)
            )}
          </div>
          <br />
          <div id='hand' style={{display: ((this.state.callStatus == 0 && this.state.isTurn && this.state.hasDrawn) ? "block" : "none")}}>
            {this.state.hand.map((name, index) => 
                (<button className='col-md-2' onClick={this.select.bind(this,index)}>  Card {index+1}: {this.state.hand[index]}  </button>)
            )}
            <button className='col-md-2' onClick={this.playCards}>  SUBMIT CHOICES </button>
          </div>*/}

        {/* Cards */}

        <div id='hand' 
             className={this.shouldHide(this.state.callStatus == 0 && !(this.state.isTurn && this.state.hasDrawn))}>
          {this.state.hand.map((name, index) => 
              (<div className='card '>  
                <span> {this.translate(this.state.hand[index])} </span>
              </div>)
          )}
        </div>

        <br />

        <div id='hand' 
             className={this.shouldHide(this.state.callStatus == 0 && this.state.isTurn && this.state.hasDrawn)}>
          {this.state.hand.map((name, index) => 
              (<button onClick={this.select.bind(this,index)}
                       className={'card ' + this.shouldSelect(this.state.chosenCards.includes(index.toString), index)} > 
                <span> {this.translate(this.state.hand[index])} </span> 
              </button>)
          )}

        </div>


        {/* Submit Button */}

        <div id='invalidPlay' className={this.shouldHide(this.state.playInvalid)}>
          Play invalid! Please only play matching cards, straights of the same suit, or single cards.
        </div>

        <button className={'submit-button btn btn-default ' + this.shouldHide(this.state.callStatus == 0 && this.state.isTurn && this.state.hasDrawn)} 
                onClick={this.playCards}>  
          Submit Choices 
        </button>

        {/* Yusef Button */}

        <button type="button"
          onClick={this.yusef}
          className={'yusef-button btn btn-lg btn-default ' + 
                     this.shouldHide(this.state.callStatus == 0 && this.state.isTurn && !this.state.hasDrawn)}>
          Yusef!
        </button>

        {/* Call Status */}

        <div id='passCall' className={this.shouldHide(this.state.callStatus == 1)}>
          Your Call Passed!
        </div>

        <div id='failCall'  className={this.shouldHide(this.state.callStatus == -1)}>
          Your Call Failed!
        </div>

        <div id='passCall' className={this.shouldHide(this.state.callStatus == 2)}>
          Another Player's Call Passed!
        </div>

        <div id='failCall' className={this.shouldHide(this.state.callStatus == -2)}>
          Another Player's Call Failed!
        </div>

        <div id='lost' style={{display: ((this.state.endStatus == -1) ? "block" : "none")}}>
          Oh no! You lost! Players are currently posting on your Twitter.
        </div>

        <div id='won' style={{display: ((this.state.endStatus == 1) ? "block" : "none")}}>
          <form onSubmit={this.postTwitter} className={'tweet-form'}>
            <input type="text" className="form-control" id="test"
                   placeholder="Loser's new status" 
                   ref="inputText"
                   aria-describedby="basic-addon1"/>
            <button type="submit" className="btn btn-md btn-default">
              Post!
            </button>
          </form>
        </div>
      </div>
    )
  }
}

module.exports = Game;