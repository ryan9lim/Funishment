/*
   * Main button of game clicked
   */
   clickButton() {

    if(!this.state.clicked && this.state.gameStarted) {
      this.pubnubDemo.publish(
      {
        message: {
          buttonPressed: 'true',
          targetUser: 'friend',
          newCount: this.state.score + 1,
          uuid: this.pubnubDemo.getUUID()
        },
        channel: this.channelName
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
        score: this.state.score + 1,
        clicked: true,
        isSelected: this.state.isSelected ? false : true
      });
    }
  }

   if (response.message.newCount != null) {
      console.log("response is", response);
      console.log("my own uuid is", this.pubnubDemo.getUUID());
      console.log("found a new count and it is", response.message.newCount);
      if(response.message.uuid != this.pubnubDemo.getUUID()) {
        console.log("opponent clicked");
        if (Math.abs(response.timetoken - this.state.highTime) < 50000000) {
          if (!this.state.cleared) {
            this.pubnubDemo.publish(
            {
              message: {
                newCount: 0,
                uuid: this.pubnubDemo.getUUID()
              },
              channel: this.channelName
            });
            this.setState({
              cleared: true,
              score: 0,
              highTime: response.timetoken
            });
          }
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