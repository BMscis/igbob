export type AppState = Map<string, number | bigint | string>;

export interface App {
  app_id: number,
  app_global_state?: AppState;
  manage_app_id: number,
  manage_app_global_state?: AppState;
  name: string,
  description: string,
  issuer_address: string,
  green_verifier_address: string,
  bond_id: number,
  bond_escrow_address: string,
  stablecoin_escrow_address: string,
  bond_escrow_program: string,
  stablecoin_escrow_program: string,
  bond_length: number,
  period: number,
  start_buy_date: number,
  end_buy_date: number,
  maturity_date: number,
  bond_cost: number,
  bond_coupon: number,
  bond_principal: number,
}
