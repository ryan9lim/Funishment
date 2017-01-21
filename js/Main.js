import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';

class Main extends React.Component{
  constructor(props) {
    super(props);
    this.clickButton = this.clickButton.bind(this);
    this.gameStart = this.gameStart.bind(this);
    this.startCountdown = this.startCountdown.bind(this);
    this.updateMessageOnListener = this.updateMessageOnListener.bind(this);
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe',
      uuid: PubNub.generateUUID()
    });
    this.state = {
      score: 0,
      countdown: 3,
      isSelected: false
    }
  }
  /*
   * Callback of element initialization
   */
  componentWillMount(){
    this.pubnubDemo.addListener({
      message: this.updateMessageOnListener,
      presence: function(presenceEvent){
        console.log(presenceEvent);
      }
    })
    this.pubnubDemo.subscribe({
      channels: ['testChannel'],
      withPresence: true
    })
  }
  updateMessageOnListener(response) {
    if (response.message.newCount != null) {
      console.log("found a new count and it is", response.message.newCount);
      this.setState({
        score: response.message.newCount
      });
    }
    console.log(response.message);
  }
  /*
   * Main button of game clicked
   */
  clickButton() {
    var random = Math.floor(Math.random() * 2);

    // Win
    // if (random == 0) {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
          targetUser: 'friend',
          newCount: this.state.score + 1
        },
        channel: 'testChannel'
      },
      function (status, response) {
        if (status.error) {
          console.log(status);
        } else {
          console.log("message Published w/ timetoken", response.timetoken);
        }
      }
      );
      this.setState({
        score: this.state.score + 1
      })
        // Post to friend's Twitter
      /* } else {
        // Lose
        this.pubnubDemo.publish(
        {
          message: {
            buttonPressed: 'true',
            targetUser: 'me'
          },
          channel: 'testChannel'
        },
        function (status, response) {
          if (status.error) {
            console.log(status);
          } else {
            console.log("message Published w/ timetoken", response.timetoken);
          }
        }
        );
        // Friend posts to your Twitter
      }*/

      this.setState({
        isSelected: this.state.isSelected ? false : true
      });
    }
    /*
     * Send start message to the channel
     */
    gameStart() {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
        },
        channel: 'testChannel'
      },
      function (status, response) {
        if (status.error) {
          console.log(status);
        } else {
          console.log("message Published w/ timetoken", response.timetoken);
        }
      }
      );

      // TODO: Do the following only if all users are in
      this.startCountdown();
    }
    startCountdown() {
      if (this.state.countdown <= 0) {
        return;
      } else {
        this.setState({
          countdown: this.state.countdown - 1
        });
        setTimeout(this.startCountdown, 1000); // check again in a second
      }
    }
    render() {
      const cssClasses = ClassNames({
        'btn': true, 
        'btn-lg': true, 
        'btn-default': true,
        'Button': true,
        'is-selected': this.state.isSelected
      });

      return (
        <div className='Index'>
          <button type="button"
          onClick={this.gameStart}
          className='btn btn-lg btn-default'>
          Start
          </button>
          <button type="button"
          onClick={this.clickButton}
          className='btn btn-lg btn-default'>
          Click on button
          </button>
          <h1> COUNTDOWN: {this.state.countdown} </h1>
          <h1> Current Score: {this.state.score} </h1>
        </div>
        )
      }
    }

    module.exports = Main;