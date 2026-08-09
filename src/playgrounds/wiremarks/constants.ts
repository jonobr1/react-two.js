export const unit = 200;

export interface DashesArray extends Array<number> {
  offset: number;
}

export const dashes: DashesArray = Object.assign([unit * 0.03, unit * 0.045], {
  offset: 0,
});

export const textStyles = {
  family: '"Inter", sans-serif',
  size: unit * 0.1,
  leading: unit * 0.12,
  fill: 'white',
};
