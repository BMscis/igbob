import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux'
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {
  getAppLocalTradeSelector, getBondBalanceSelector,
  getOptedIntoAppSelector,
  getOptedIntoBondSelector,
  selectedAccountSelector
} from '../redux/selectors/userSelector';
import { App, AppState, Trade, UserAccount } from '../redux/types';
import { AlgoNumberInput } from '../common/NumberInput';
import { tradeBond } from '../algorand/bond/Trade';
import { formatAlgoDecimalNumber } from '../utils/Utils';
import { getAccountInformation } from '../algorand/account/Account';
import { getStateValue } from './Utils';
import { setSelectedAccount } from '../redux/actions/actions';

interface StateProps {
  selectedAccount?: UserAccount;
  getOptedIntoBond: (bondId: number) => boolean;
  getOptedIntoApp: (appId: number) => boolean;
  getAppLocalTrade: (appId: number) => number;
  getBondBalance: (bondId: number) => number | bigint;
}

interface DispatchProps {
  setSelectedAccount: typeof setSelectedAccount;
}

interface OwnProps {
  app: App;
  trade: Trade;
}

type TradeProps = StateProps & DispatchProps & OwnProps;

function TradeBuyContainer(props: TradeProps) {

  const [noOfBondsToBuy, setNoOfBondsToBuy] = useState<number>(0);
  const [bondsAvailable, setBondsAvailable] = useState<number>(0);
  const [isSellerFrozen, setIsSellerFrozen] = useState<boolean>(true);

  const {
    app,
    trade,
    selectedAccount,
    getOptedIntoBond,
    getOptedIntoApp,
    getBondBalance,
    setSelectedAccount,
  } = props;

  const bondBalance: number = app ? (getBondBalance(app.bond_id) as number) : 0;

  const updateBondsAvailable = async () => {
    // Fetch seller account info
    getAccountInformation(trade.seller_address).then((acc: UserAccount) => {
      const { appsLocalState } = acc;
      const appId = app.app_id;
      if (appsLocalState.has(appId)) {
        const localState: AppState = appsLocalState.get(appId)!;
        // Update bonds available
        setBondsAvailable(getStateValue("Trade", localState) / 1e6);
        // Update if frozen
        setIsSellerFrozen(getStateValue('Frozen', localState) === 0);
      }
    });
  }

  // Set max number of bonds that can be purchased on initial render
  useEffect(() => {
    updateBondsAvailable();
  }, []);

  const canTrade = () => {
    return app && trade &&
      noOfBondsToBuy !== 0 &&
      noOfBondsToBuy <= bondsAvailable &&
      getOptedIntoBond(app.bond_id) &&
      getOptedIntoApp(app.app_id) &&
      !isSellerFrozen &&
      getStateValue('Frozen', app.app_global_state) > 0;
  }

  const tradeTooltip = () => {
    if (!app) return undefined;

    let err = '';
    if (noOfBondsToBuy === 0) err = err.concat('Must specify more than 0 bonds\n');
    if (noOfBondsToBuy > bondsAvailable ) err = err.concat('Must be less than max number of available bonds\n');
    if (!getOptedIntoBond(app.bond_id)) err = err.concat('Must be opted into bond\n');
    if (!getOptedIntoApp(app.app_id)) err = err.concat('Must be opted into app\n');
    if (isSellerFrozen) err = err.concat("Seller's account is frozen\n");
    if (getStateValue('Frozen', app.app_global_state) === 0) err = err.concat('Your account is frozen\n');
    return err;
  }

  const handleSetTrade= async () => {
    if (!selectedAccount) return;

    await tradeBond(
      trade.lsig,
      trade.lsig_program,
      trade.seller_address,
      selectedAccount.address,
      app.app_id,
      app.bond_id,
      app.bond_escrow_address,
      app.bond_escrow_program,
      noOfBondsToBuy * 1e6,
      trade.price,
    )
    // Update bond balance and max no of bonds available
    getAccountInformation(selectedAccount.address).then(acc => setSelectedAccount(acc));
    updateBondsAvailable();
  };

  return (
    <Grid container spacing={3}>

      <Grid item xs={12}>
        <TextField
          label="Seller Address:"
          defaultValue={trade.seller_address}
          required
          fullWidth
          InputProps={{ readOnly: true }}
          InputLabelProps={{ required: false }}
          style={{ margin: '8px 0px' }}
        />
      </Grid>

      {/*Row split into halves*/}
      <Grid item xs={5}>
        <FormControl fullWidth>
          <TextField
            label="No. of Bonds To Buy:"
            value={noOfBondsToBuy}
            onChange={e => setNoOfBondsToBuy(Number(e.target.value))}
            fullWidth
            InputLabelProps={{ required: false }}
            InputProps={{ inputComponent: AlgoNumberInput }}
          />
        </FormControl>
      </Grid>

      <Grid item xs={7} title={tradeTooltip()}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          style={{ textTransform: 'none' }}
          disabled={!canTrade()}
          onClick={handleSetTrade}
        >
          You own {formatAlgoDecimalNumber(bondBalance)} bonds <br/>
          {bondsAvailable.toFixed(6)} bonds available <br/>
          BUY {noOfBondsToBuy} bonds for ${(noOfBondsToBuy * trade.price).toFixed(6)}
        </Button>
      </Grid>

    </Grid>
  );
}

const mapStateToProps = (state: any) => ({
  selectedAccount: selectedAccountSelector(state),
  getOptedIntoBond: getOptedIntoBondSelector(state),
  getOptedIntoApp: getOptedIntoAppSelector(state),
  getAppLocalTrade: getAppLocalTradeSelector(state),
  getBondBalance: getBondBalanceSelector(state),
});

const mapDispatchToProps = {
  setSelectedAccount,
};

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(TradeBuyContainer);
