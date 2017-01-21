import Hello from './Hello';
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
      isSelected: false,
      totalReady: 0,
      highTime: 0,
      clicked: false
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
      console.log("response is", response);
      console.log("found a new count and it is", response.message.newCount);
      if(response.message.uuid != this.pubnubDemo.getUUID()) {
        console.log("opponent clicked");
        if (Math.abs(response.timetoken - this.state.highTime) < 50000000) {
          this.pubnubDemo.publish(
          {
            message: {
              buttonPressed: 'true',
              targetUser: 'friend',
              newCount: 0,
              uuid: this.state.uuid
            },
            channel: 'testChannel'
          });
          this.setState({
            score: 0,
            highTime: response.timetoken
          });
        } else {
          this.setState({
            score: response.message.newCount,
            highTime: response.timetoken
          });
        }
      } else {
        this.setState({
          highTime: response.timetoken
        });
      }
    }
    if (response.message.readyCount != null) {
      console.log("total ready: ", response.message.readyCount);
      this.setState({
        totalReady: response.message.readyCount
      })
    }
    var component = this;
    this.pubnubDemo.hereNow(
    {
      channels: ["testChannel"],
      includeUUIDs: true,
      includeState: true
    },
    function (status, response) {
      console.log("hello", response);
      if(component.state.totalReady == response.totalOccupancy){
        console.log("hihireadytogo");
        component.startCountdown();
      }
      else{
        console.log("Not ready yet, occupancy is ", response.totalOccupancy);
      }
    });

    console.log(response.message);
  }
  /*
   * Main button of game clicked
   */
   clickButton() {
    var random = Math.floor(Math.random() * 2);

    // Win
    // if (random == 0) {
    if(!this.state.clicked) {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
          targetUser: 'friend',
          newCount: this.state.score + 1,
          uuid: this.pubnubDemo.getUUID()
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
        score: this.state.score + 1,
        clicked: true,
        isSelected: this.state.isSelected ? false : true
      });
    }
  }
    /*
     * Send start message to the channel
     */
     gameStart() {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
          readyCount: this.state.totalReady + 1
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
      //this.startCountdown();
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
        <div>
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
          <h1> Most Recent Time: {this.state.highTime} </h1>
          <h1> {this.state.clicked ? "CLICKED" : "NOT YET CLICKED"} </h1>
        </div>
        )
      }
    }

    module.exports = Main;