import React, { useEffect } from "react";
import { Route, Switch } from 'react-router-dom';
import IssuerPage from "./issuer/IssuerPage";
import InvestorPage from "./investor/InvestorPage";
import HomePage from "./home/HomePage";
import ProtectedRoute from "./auth/ProtectedRoute";
import Profile from "./auth/Profile";
import SettingsPage from "./settings/SettingsPage";
import NavbarManager from "./navbar/NavbarManager";
import DashboardPage from "./dashboard/DashboardPage";
import { useAuth0 } from '@auth0/auth0-react';
import { setAccountAddresses, setSelectedAddress } from './redux/actions/actions';
import { connect } from 'react-redux';

interface AppProps {
  setAccountAddresses: typeof setAccountAddresses;
  setSelectedAddress: typeof setSelectedAddress;
}

function App(props: AppProps) {

  const { setAccountAddresses, setSelectedAddress } = props;
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  async function fetchAddresses() {
    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch("https://igbob.herokuapp.com/accounts/get-addresses", {
        headers: { Authorization: `Bearer ${accessToken}`},
      });
      const parseResponse = await response.json();
      setAccountAddresses(parseResponse.addresses);
      if (parseResponse.addresses[0]) setSelectedAddress(parseResponse.addresses[0]);
    } catch (err) {
      console.error(err.message);
    }
  }

  // fetch initial user state when switched from logged out to logged in
  useEffect( () => {
    if (isAuthenticated) fetchAddresses();
  }, [isAuthenticated]);

  return (
    <div>
      <NavbarManager/>
      <Switch>
        <ProtectedRoute exact path="/dashboard" component={DashboardPage}/>
        <ProtectedRoute exact path="/issuer" component={IssuerPage}/>
        <ProtectedRoute exact path="/investor" component={InvestorPage}/>
        <ProtectedRoute exact path="/settings" component={SettingsPage}/>
        <ProtectedRoute exact path="/profile" component={Profile}/>
        {/*Placed last to catch all unknown paths*/}
        <Route component={HomePage}/>
      </Switch>
    </div>
  );
}

const mapDispatchToProps = {
  setAccountAddresses,
  setSelectedAddress
};

export default connect(undefined, mapDispatchToProps)(App);