import React from 'react';

class Hello extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      sampleProps: 6
    };
  }
  render() {
    return (
      <div>
      <h1>Hello, world. Print number {4+6}</h1>
      <SampleChild sampleProps={this.state.sampleProps}/>
      </div>
    )
  }
}

class SampleChild extends React.Component{
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <a>{this.props.sampleProps}</a>
    )
  }
}

export default Hello;

