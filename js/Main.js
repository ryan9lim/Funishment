import Hello from './Hello';
import React from 'react';
import ReactDOM from 'react-dom';

class Main extends React.Component{
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <button type="button" 
              className='btn btn-lg btn-default'>
        Click on button
      </button>
    )
  }
}

module.exports = Main;