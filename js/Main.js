import Hello from './Hello';
import React from 'react';
import ReactDOM from 'react-dom';

class Main extends React.Component{
  constructor(props) {
    super(props);
    this.pubnubDemo = new PubNub({
      publishKey: 'pub-c-89d8d3f5-9d58-4c24-94e7-1c89f243296a',
      subscribeKey: 'sub-c-99748e0e-df8d-11e6-989b-02ee2ddab7fe'
    });
    this.state = {
      uuid: Math.floor(Math.random * 256);
    }
  }
  componentWillMount(){
    pubnub.publish(
      {
        message: {
          user: this.state.uuid.toString()
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
    this.clickButton = this.clickButton.bind(this);
  }
  clickButton() {
    var random = Math.floor(Math.random * 2);
    if (random == 0) {
      pubnub.publish(
      {
        message: {
          buttonPressed: 'true',
          targetUser: 'friend'
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
      } else {
        pubnub.publish(
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