export interface TestData {
  type: string;
  bandwidth: number;
  frequency: number;
  modulation: { label: string; value: number }[];
  time: number;
}
