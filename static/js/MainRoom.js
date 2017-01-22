import React from 'react';
import ReactDOM from 'react-dom';
import ClassNames from 'classnames';
import Store from 'store2';
import Axios from 'axios';

class MainRoom extends React.Component{
  constructor(props) {
    super(props);
  }
  componentWillMount() {
    console.log('Mounting');
    Axios.get('/redirect_to_auth')
         .then((resp) => {console.log(resp);})
         .catch((err) => {console.log(err );});
  }
  render() {
    return (
      <div className='Room'>
        <div className='container'>
          <p>Funishment</p>
          <ChannelForm />
          <ChannelList />
        </div>
      </div>
    )
  }
}

class ChannelForm extends React.Component {
  constructor(props) {
    super(props);
    this.onAddChannel = this.onAddChannel.bind(this);
    this.state = {
      channelName: ''
    }
  }
  onAddChannel(event) {
    event.preventDefault();
    this.setState({
      channelName: this.refs.inputText.value
    });
    Store('channelName', this.refs.inputText.value);
    window.location = '/';
  }
  render() {
    return (
      <div className="ChannelForm">
        <form onSubmit={this.onAddChannel}>
          <input type="text" className="form-control" id="test"
                 placeholder="Ryan's Magical Palace" 
                 ref="inputText"
                 aria-describedby="basic-addon1"/>
          <button type="submit" className="btn btn-md btn-default">
            Create Channel
          </button>
        </form>
      </div>
    )
  }
}

class ChannelList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      channelList: ['Channel 1', 'Channel 2', 'Channel 3']
    }
  }
  render() {
      return (
        <div className='ChannelList'>
          {this.state.channelList.map((name, index) => 
              (<button className='btn btn-lg btn-default' key={index}>
                {'Go to ' + name}
              </button>)
          )}                          
        </div>
      )
  }
}

module.exports = MainRoom;  