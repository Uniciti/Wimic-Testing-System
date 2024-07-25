export const modName = [
  "BPSK 1/2",
  "QPSK 1/2",
  "QPSK 3/4",
  "QAM16 1/2",
  "QAM16 3/4",
  "QAM64 2/3",
  "QAM64 3/4",
];

export let statVer = "M-1";

export const sens10 = [88.5, 85.5, 83, 80, 76.5, 72.5, 70.5];

export const speed10 = [1600, 3500, 5250, 7000, 10500, 14500, 16500];

export const sens20 = [86, 82.5, 80, 77, 73.5, 70, 67.5];

export const speed20 = [3500, 7400, 11500, 15000, 23000, 30750, 34000];

export function setConsts(model: string, array: any[]): void {
  try {
    for (let i = 0; i < array.length; i++) {
      sens10[i] = array[i].sensitivity10;
      speed10[i] = array[i].speed10;
      sens20[i] = array[i].sensitivity20;
      speed20[i] = array[i].speed20;
    }
    
    statVer = model;
  } catch (error) {
    console.error(error);
  }
}

export function getConsts(): [any[], string] {
  const out: any[] = [];
  for (let i = 0; i < modName.length; i++) {
    out.push({
      name: modName[i],
      speed10: speed10[i],
      speed20: speed20[i],
      sensitivity10: sens10[i],
      sensitivity20: sens20[i],
    });
  }

  return [out, statVer];
}
