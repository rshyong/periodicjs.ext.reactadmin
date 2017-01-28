import React, { Component, PropTypes, } from 'react';
import { Column, Columns, } from 're-bulma';
import {  AsyncStorage,  } from 'react-native';
import moment from 'moment';
import styles from '../../styles';
import constants from '../../constants';
import AppHeader from '../AppHeader';
import AppFooter from '../AppFooter';
import AppSidebar from '../AppSidebar';
import AppSectionLoading from '../AppSectionLoading';
import AppOverlay from '../AppOverlay';

// let testNavigation = () => {
//   // setTimeout(() => {
//   //   this.props.reduxRouter.push('/blog/234');
//   //   setTimeout(() => {
//   //     this.props.reduxRouter.push('/documentation');
//   //     setTimeout(() => {
//   //       this.props.reduxRouter.goBack();
//   //       setTimeout(() => {
//   //         this.props.reduxRouter.goForward();
//   //       }, 1000);
//   //     }, 1000);
//   //   }, 1000);
//   // }, 1000);
// }

class MainApp extends Component{
  constructor(props/*, context*/) {
    super(props);
    // console.log({ props, context });
    this.state = props;
    // this.previousRoute = {};
  }
  componentWillReceiveProps(nextProps) {
    // console.log('componentWillReceiveProps nextProps', nextProps);
    this.setState(nextProps);
  }
  componentDidMount() {
    // testNavigation();
    // setLayoutHandler.call(this);
    // console.log('componentDidMount this.props', this.props);
    Promise.all([
      AsyncStorage.getItem(constants.jwt_token.TOKEN_NAME),
      AsyncStorage.getItem(constants.jwt_token.TOKEN_DATA),
      AsyncStorage.getItem(constants.jwt_token.PROFILE_JSON),
      this.props.fetchMainComponent(),
      this.props.fetchErrorComponents(),
      // AsyncStorage.getItem(constants.async_token.TABBAR_TOKEN),
    ])
      .then((results) => {
        try {
          let jwt_token = results[ 0 ];
          let jwt_token_data = JSON.parse(results[ 1 ]);
          let jwt_user_profile = JSON.parse(results[ 2 ]);
          // console.log({ jwt_token, jwt_token_data, jwt_user_profile });
          if (jwt_token_data && jwt_user_profile) {
            let url = '/api/jwt/token'; //AppLoginSettings[this.props.page.runtime.environment].login.url;
            let response = {};
            let json = {
              token: jwt_token_data.token,
              expires: jwt_token_data.expires,
              timeout: jwt_token_data.timeout,
              user: jwt_user_profile,
            };
            let currentTime = new Date();
            
            if (moment(jwt_token_data.expires).isBefore(currentTime)) {
              let expiredTokenError = new Error(`Access Token Expired ${moment(jwt_token_data.expires).format('LLLL')}`);
              let task = setTimeout(() => {
                this.handleErrorNotification({ message: 'Access Token Expired' + expiredTokenError, }, expiredTokenError);
                clearTimeout(task);
              }, 1000);
              throw expiredTokenError;
            } else {
              // console.log('saving logged in user', { json, });
              this.props.saveUserProfile(url, response, json);
              this.props.initializeAuthenticatedUser(json.token);
              // if (appTabs) {
              //   this.props.setTabExtensions(appTabs);
              // }
            }
          } else if (jwt_token) {
            this.props.getUserProfile(jwt_token);
            this.props.initializeAuthenticatedUser(jwt_token);
          }
          else {
            console.log('MAIN componentDidMount USER IS NOT LOGGED IN');
          }
          this.props.setUILoadedState(true);  
        } catch (e) {
          this.props.errorNotification(e);
          // console.log(e);
        }
        
      })
      .catch((error) => {
        this.props.errorNotification(error);
        // console.error('MAIN componentDidMount: JWT USER Login Error.', error);
        this.props.logoutUser();
        this.props.setUILoadedState(true);
      });
  }
  componentWillUnmount() {
  }
  // componentWillUpdate(nextProps, nextState) {
  //   // console.log('COMPONENT WILL UPDATE');
  //   // console.log('COMPONENT WILL UPDATE',{refs:this.refs}, { nextProps }, { nextState })
  //   // this.loadExtensionRoute(nextProps.location.pathname);
  //   // perform any preparations for an upcoming update

  // }
  render() {
    // console.log('this.state', this.state);
    let sidebarColumn = (this.state.ui.sidebar_is_open)
      ? (<Column size="isNarrow" style={Object.assign({}, styles.fullMinHeight, styles.fullHeight)}>
        <AppSidebar {...this.state} />
      </Column>)
      : null;
    
    let headerNav = (this.state.settings.ui.initialization.show_header || this.state.user.isLoggedIn)
      ? (<AppHeader {...this.state} />)
    : null;
    let footerNav = (this.state.settings.ui.initialization.show_footer || this.state.user.isLoggedIn)
      ? (<AppFooter {...this.state} />)
    : null;  
    // return (<AppSectionLoading/>);
    return (
      (this.state.ui.ui_is_loaded === false)
        ? (<AppSectionLoading><AppOverlay {...this.state}/></AppSectionLoading>)
        : (<div>
          {/*<div style={styles.redBkgrd}>*/}
          {headerNav}
          <main style={styles.fullHeight}>
            {/*DEBUG HERE */}
            <Columns style={Object.assign({}, styles.fullMinHeight, styles.fullHeight)}>
              {sidebarColumn}
              <Column style={styles.fullMinHeight}>
                {this.props.children}
              </Column>
            </Columns>
          </main>
          {footerNav}
          <AppOverlay {...this.state}/>
        </div>)
    );
  }
}
MainApp.contextTypes = {
  router: PropTypes.object.isRequired,
};

export default MainApp;