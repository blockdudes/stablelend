import { ethers } from 'ethers';

const abi = [
  'function calculateCollateral(address collateralOwner) external view returns(uint256 value)',
  'function calculateSingleCollateral(address collateralOwner, address collateral) external view returns(uint256 value)',
  'function stakePrice(uint256 amount) external view returns(uint256 value)',
  'function balances(address account, address collateral) external view returns(uint256 value)',
  'function borrowed(address account) external view returns(uint256 value)',
  'function stakeBalance(address account) external view returns(uint256 value)',
  'function deposit(uint256 amount, address rToken) external',
  'function withdraw(uint256 amount, address rToken) external',
  'function borrow(uint256 amount) external',
  'function repay(uint256 amount) external',
  'function liquidate(address borrower) external',
  'function stake(uint256 amount) external',
  'function unstake(uint256 amount) external',
];
const erc20abi = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
];
const stableLendContract = '0xf63df3ac47b2a2f3ae4a646e7bf3f707403f69f0';
export const rsvAddress = '0x196f4727526eA7FB1e17b2071B3d8eAA38486988';

export const poolList = [
  { address: '0xe2822bbB0c962aAce905773b15adf50706258A8A', name: 'RUSD' },
];

export async function homeDataFetch(account, provider) {
  const contract = new ethers.Contract(stableLendContract, abi, provider);

  const collateralValue = Number(
    ethers.utils.formatEther(await contract.calculateCollateral(account))
  );
  const borrowValue = Number(
    ethers.utils.formatEther(await contract.borrowed(account))
  );
  // const borrowValue = await contract.borrowed(account);

  const stakePrice = Number(
    ethers.utils.formatEther(
      await contract.stakePrice(ethers.utils.parseUnits('1', 'ether'))
    )
  );

  const totalStakeAmount = Number(
    ethers.utils.formatEther(await contract.stakeBalance(account))
  );

  const stakedValue = stakePrice * totalStakeAmount;

  return {
    collateralValue,
    borrowValue,
    stakedValue,
    stakePrice,
    totalStakeAmount,
  };
}

export async function collateralDataFetch(account, collateral, provider) {
  const contract = new ethers.Contract(stableLendContract, abi, provider);

  const depositValue = Number(
    ethers.utils.formatEther(
      await contract.calculateSingleCollateral(account, collateral)
    )
  );
  const depositAmount = Number(
    ethers.utils.formatEther(await contract.balances(account, collateral))
  );

  return { depositValue, depositAmount };
}
export async function allowed(token, amt, provider, from) {
  try {
    if (amt <= 0 || token == null) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');

    const erc20Contract = new ethers.Contract(
      token,
      erc20abi,
      provider.getSigner()
    );
    const allowance = await erc20Contract.allowance(from, stableLendContract);
    if (allowance.lt(amount)) return false;
    else return true;
  } catch (e) {
    console.log(e);
  }
}
export async function approve(token, provider) {
  try {
    if (token == null) return;
    const erc20Contract = new ethers.Contract(
      token,
      erc20abi,
      provider.getSigner()
    );
    const approveTx = await erc20Contract.approve(
      stableLendContract,
      ethers.constants.MaxUint256
    );
    await approveTx.wait();
  } catch (e) {
    console.log(e);
  }
}

export async function deposit(amt, collateral, provider, from) {
  try {
    if (amt <= 0 || collateral == null) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');
    const contract = new ethers.Contract(
      stableLendContract,
      abi,
      provider.getSigner()
    );
    const erc20Contract = new ethers.Contract(
      collateral,
      erc20abi,
      provider.getSigner()
    );
    const allowance = await erc20Contract.allowance(from, stableLendContract);

    const balance = await erc20Contract.balanceOf(from);

    if (balance.gte(amount)) {
      if (allowance.lt(amount)) {
        const approveTx = await erc20Contract.approve(
          stableLendContract,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
        const depositTx = await contract.deposit(amount, collateral);
        await depositTx.wait();
      } else {
        const depositTx = await contract.deposit(amount, collateral);
        await depositTx.wait();
      }
    } else {
      console.log(balance);
      console.log('not enough balance ');
      //alert
    }
  } catch (e) {
    console.log(e);
  }
}

export async function withdraw(amt, collateral, provider, from) {
  try {
    if (amt <= 0 || collateral == null) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');
    const contract = new ethers.Contract(
      stableLendContract,
      abi,
      provider.getSigner()
    );

    const borrowedAmount = await contract.borrowed(from);

    const depositedAmount = await contract.balances(from, collateral);
    if (depositedAmount.gte(amount)) {
      if (borrowedAmount.lt(ethers.utils.parseUnits('0.1', 'ether'))) {
        const withdrawTx = await contract.withdraw(amount, collateral);
        await withdrawTx.wait()
      } else {
        // alert
      }
    } else {
      // alert
    }
  } catch (e) {
    console.log(e);
  }
}

export async function stake(amt, provider, from) {
  try {
    if (amt <= 0) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');
    const contract = new ethers.Contract(
      stableLendContract,
      abi,
      provider.getSigner()
    );
    const erc20Contract = new ethers.Contract(
      rsvAddress,
      erc20abi,
      provider.getSigner()
    );
    const allowance = await erc20Contract.allowance(from, stableLendContract);

    const balance = await erc20Contract.balanceOf(from);

    if (balance.gte(amount)) {
      if (allowance.lt(amount)) {
        const approveTx = await erc20Contract.approve(
          stableLendContract,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
        const stakeTx = await contract.stake(amount);
        await stakeTx.wait();
      } else {
        const stakeTx = await contract.stake(amount);
        await stakeTx.wait();
      }
    } else {
      console.log(balance);
      console.log('not enough balance ');
      //alert
    }
  } catch (e) {
    console.log(e);
  }
}

export async function unstake(amt, provider, from) {
  try {
    if (amt <= 0) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');
    const contract = new ethers.Contract(
      stableLendContract,
      abi,
      provider.getSigner()
    );

    const stakedAmount = await contract.stakeBalance(from);

    if (stakedAmount.gte(amount)) {
      const tx = await contract.unstake(amount);
      await tx.wait()
    } else {
      // alert
    }
  } catch (e) {
    console.log(e);
  }
}


export async function borrow(amt, provider, from) {
  try {
    if (amt <= 0) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');
    const contract = new ethers.Contract(
      stableLendContract,
      abi,
      provider.getSigner()
    );
    const collateral = await contract.calculateCollateral(from);

    const alreadyBorrowed = await contract.borrowed(from);
    
    const availableCollateral = collateral.sub(alreadyBorrowed)
    if (availableCollateral.gte(amount)) {
      const tx = await contract.borrow(amount);
      await tx.wait()
    } else {
      // alert
    }
  } catch (e) {
    console.log(e);
  }
}
export async function repay(amt, provider, from) {
  try {
    if (amt <= 0) return;
    const amount = ethers.utils.parseUnits(amt, 'ether');
    const contract = new ethers.Contract(
      stableLendContract,
      abi,
      provider.getSigner()
    );
    const erc20Contract = new ethers.Contract(
      rsvAddress,
      erc20abi,
      provider.getSigner()
    );
    const allowance = await erc20Contract.allowance(from, stableLendContract);

    const balance = await erc20Contract.balanceOf(from);

    if (balance.gte(amount)) {
      if (allowance.lt(amount)) {
        const approveTx = await erc20Contract.approve(
          stableLendContract,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
        const tx = await contract.repay(amount);
        await tx.wait();
      } else {
        const tx = await contract.repay(amount);
        await tx.wait();
      }
    } else {
      console.log(balance);
      console.log('not enough balance ');
      //alert
    }
  } catch (e) {
    console.log(e);
  }
}

