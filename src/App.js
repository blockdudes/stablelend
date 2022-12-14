import React, { useEffect, useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  CardBody,
  Card,
  SimpleGrid,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  InputGroup,
  Input,
  Flex,
  Heading,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
} from '@chakra-ui/react';
import theme from './theme';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import {
  allowed,
  approve,
  borrow,
  collateralDataFetch,
  deposit,
  homeDataFetch,
  poolList,
  repay,
  rsvAddress,
  stake,
  unstake,
  withdraw,
} from './utils';
import { isDesktop } from 'react-device-detect';

const providerOptions = {
  // wallet options
};
function App() {
  const [connectedAccount, setConnectedAccount] = useState('');
  const [web3Provider, setWeb3Provider] = useState(null);

  const [homeData, setHomeData] = useState({
    collateralValue: 0,
    borrowValue: 0,
    stakedValue: 0,
    stakePrice: 0,
    totalStakeAmount: 0,
  });
  const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
  });

  const [collateralData, setCollateralData] = useState({
    depositValue: 0,
    depositAmount: 0,
  });

  const [depositWithdrawAmount, setDepositWithdrawAmount] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [unstakeAmount, setUnstakeAmount] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [repayAmount, setRepayAmount] = useState(0);

  const [selectedPoolIndex, setSelectedPoolIndex] = useState();

  const [collateralTokenAllowed, setCollateralTokenAllowed] = useState(false);
  const [rsvTokenAllowed, setRsvTokenAllowed] = useState(false);

  const [loadingModal, setLoadingModal] = useState(false);

  const {
    isOpen: isDepositModalOpen,
    onOpen: onDepositModalOpen,
    onClose: onDepositModalClose,
  } = useDisclosure();
  const {
    isOpen: isStakeModalOpen,
    onOpen: onStakeModalOpen,
    onClose: onStakeModalClose,
  } = useDisclosure();
  const {
    isOpen: isRepayModalOpen,
    onOpen: onRepayModalOpen,
    onClose: onRepayModalClose,
  } = useDisclosure();

  // mobile
  const [width, setWidth] = useState(window.innerWidth);

  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    };
  }, []);

  const isMobile = width <= 768;
  //

  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect();

      const provider = new ethers.providers.Web3Provider(instance);
      const web3Accounts = await provider.listAccounts();
      if (provider) {
        setWeb3Provider(provider);
      }
      setConnectedAccount(web3Accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      const data = await homeDataFetch(connectedAccount, web3Provider);
      console.log(data);
      setHomeData(data);
    };
    fetchData();
  }, [connectedAccount, web3Provider]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedPoolIndex != null) {
        const data = await collateralDataFetch(
          connectedAccount,
          poolList[selectedPoolIndex].address,
          web3Provider
        );
        console.log(data);
        setCollateralData(data);
      }
    };
    fetchData();
  }, [selectedPoolIndex, connectedAccount, web3Provider]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await allowed(
        poolList[selectedPoolIndex].address,
        depositWithdrawAmount,
        web3Provider,
        connectedAccount
      );
      setCollateralTokenAllowed(data);
    };
    if (selectedPoolIndex != null && depositWithdrawAmount !== 0) {
      fetchData();
    }
  }, [
    connectedAccount,
    selectedPoolIndex,
    web3Provider,
    depositWithdrawAmount,
  ]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  const approveButton = token => {
    if ((token === rsvAddress && rsvTokenAllowed) || (token !== rsvAddress && collateralTokenAllowed)) return <></>;
    return (
      <>
        <Container>
          <Button
            colorScheme="blue"
            w="100%"
            disabled={loadingModal}
            onClick={async () => {
              setLoadingModal(true);
              await approve(token, web3Provider);
              setLoadingModal(false);
            }}
          >
            APPROVE
          </Button>
        </Container>
      </>
    );
  };

  const depositButton = token => {
    if (depositWithdrawAmount <= 0 || selectedPoolIndex == null) return <></>;
    return (
      <>
        <Container>
          <Button
            colorScheme="blue"
            w="100%"
            disabled={loadingModal}
            onClick={async () => {
              setLoadingModal(true);
              await deposit(
                depositWithdrawAmount,
                selectedPoolIndex != null
                  ? poolList[selectedPoolIndex].address
                  : null,
                web3Provider,
                connectedAccount
              );
              setLoadingModal(false);
            }}
          >
            DEPOSIT
          </Button>
        </Container>
      </>
    );
  };

  const stakeButton = token => {
    if (stakeAmount <= 0 ) return <></>;
    return (
      <>
        <Container>
          <Button
            colorScheme="blue"
            w="100%"
            disabled={loadingModal}
            onClick={async () => {
              setLoadingModal(true);
              await stake(stakeAmount, web3Provider, connectedAccount);
              setLoadingModal(false);
            }}
          >
            STAKE
          </Button>
        </Container>
      </>
    );
  };

  const repayButton = token => {
    if (repayAmount <= 0 ) return <></>;
    return (
      <>
        <Container>
          <Button
            colorScheme="blue"
            w="100%"
            disabled={loadingModal}
            onClick={async () => {
              setLoadingModal(true);
              await repay(repayAmount, web3Provider, connectedAccount);
              setLoadingModal(false);
            }}
          >
            REPAY
          </Button>
        </Container>
      </>
    );
  };

  const transactionModal = (
    title,
    token,
    amount,
    isOpen,
    onClose,
    button
  ) => {
    return (
      <>
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader textAlign={'center'}>{title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={1} spacing={5}>
                {loadingModal ? (
                  <Center>
                    <Spinner />
                  </Center>
                ) : (
                  <></>
                )}

                {approveButton(token)}
                {button()}
              </SimpleGrid>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  };

  const depositModal = () => {
    if (selectedPoolIndex != null && depositWithdrawAmount > 0)
      return transactionModal(
        'DEPOSIT',
        poolList[selectedPoolIndex].address,
        depositWithdrawAmount,
        isDepositModalOpen,
        onDepositModalClose,
        depositButton
      );
    return <></>;
  };
  const stakeModal = () => {
    if (stakeAmount > 0)
      return transactionModal(
        'STAKE',
        rsvAddress,
        stakeAmount,
        isStakeModalOpen,
        onStakeModalClose,
        stakeButton
      );
    return <></>;
  };

  const repayModal = () => {
    if (repayAmount > 0)
      return transactionModal(
        'REPAY',
        rsvAddress,
        repayAmount,
        isRepayModalOpen,
        onRepayModalClose,
        repayButton
      );
    return <></>;
  };
  // const

  return (
    <ChakraProvider theme={theme}>
      {!isMobile ? (
        <Box>
          {depositModal()}
          {stakeModal()}
          {repayModal()}

          <Box mx={5} my={4}>
            <Flex minWidth="max-content" alignItems="center" gap="2">
              <Box p="2">
                <Heading size="md">StableLend</Heading>
              </Box>
              <Spacer />
              <Button colorScheme="blue" onClick={connectWallet}>
                {web3Provider == null
                  ? 'CONNECT'
                  : connectedAccount.slice(0, 12) + '...'}
              </Button>
            </Flex>
          </Box>

          <Box textAlign="center" fontSize="xl" mx={20} my={4}>
       
                <SimpleGrid columns={3} spacing={10}>
                  <Card>
                  <CardBody>
                  <VStack>
                    <Container>
                      <Text fontWeight={200}>Collateral Value</Text>
                    </Container>
                    <Container>
                      <Text fontSize={25} fontWeight={800}>
                        ${homeData.collateralValue.toLocaleString()}
                      </Text>
                    </Container>
                  </VStack>
                  </CardBody>
                  </Card>
                  <Card>
                  <CardBody>
                  <VStack>
                    <Container>
                      <Text fontWeight={200}>Borrow Value</Text>
                    </Container>
                    <Container>
                      <Text fontSize={25} fontWeight={800}>
                        ${homeData.borrowValue.toLocaleString()}
                      </Text>
                    </Container>
                  </VStack>
                  </CardBody>
                  </Card>
                  <Card>
                  <CardBody>
                  <VStack>
                    <Container>
                      <Text fontWeight={200}>Staked Value</Text>
                    </Container>
                    <Container>
                      <Text fontSize={25} fontWeight={800}>
                        ${homeData.stakedValue.toLocaleString()}
                      </Text>
                    </Container>
                  </VStack>
                  </CardBody>
                  </Card>
                </SimpleGrid>
              

            <SimpleGrid columns={2} spacing={20} mt={10}>
              <Card>
                <CardBody>
                  <SimpleGrid columns={1} spacing={5}>
                    <Container>
                      <Menu>
                        <MenuButton as={Button}>
                          <Text fontSize={25}>
                            {' '}
                            {selectedPoolIndex != null
                              ? poolList[selectedPoolIndex].name
                              : 'Select Collateral Pool'}{' '}
                          </Text>
                        </MenuButton>
                        <MenuList>
                          {poolList.map((e, i) => (
                            <MenuItem
                              onClick={() => {
                                setSelectedPoolIndex(i);
                              }}
                            >
                              {e.name}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>
                    </Container>

                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <VStack>
                          <Container>
                            <Text fontWeight={200}>Deposited Amount</Text>
                          </Container>
                          <Container>
                            <Text fontSize={20} fontWeight={600}>
                              {collateralData.depositAmount.toLocaleString()}
                            </Text>
                          </Container>
                        </VStack>

                        <VStack>
                          <Container>
                            <Text fontWeight={200}>Deposit Value</Text>
                          </Container>
                          <Container>
                            <Text fontSize={20} fontWeight={600}>
                              ${collateralData.depositValue.toLocaleString()}
                            </Text>
                          </Container>
                        </VStack>
                      </SimpleGrid>
                    </Container>

                    <Container>
                      <InputGroup>
                        <Input
                          type="number"
                          placeholder="Amount"
                          onChange={e =>
                            setDepositWithdrawAmount(e.target.value)
                          }
                        />
                      </InputGroup>
                    </Container>

                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <Button colorScheme="blue" onClick={onDepositModalOpen}>
                          DEPOSIT
                        </Button>
                        <Button
                          colorScheme="blue"
                          onClick={async () => {
                            await withdraw(
                              depositWithdrawAmount,
                              selectedPoolIndex != null
                                ? poolList[selectedPoolIndex].address
                                : null,
                              web3Provider,
                              connectedAccount
                            );
                          }}
                        >
                          WITHDRAW
                        </Button>
                      </SimpleGrid>
                    </Container>
                  </SimpleGrid>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <SimpleGrid spacing={8}>
                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <VStack>
                          <Container>
                            <Text fontWeight={200}>Staked RSV Token</Text>
                          </Container>
                          <Container>
                            <Text fontSize={20} fontWeight={600}>
                              {homeData.totalStakeAmount.toLocaleString()}
                            </Text>
                          </Container>
                        </VStack>

                        <VStack>
                          <Container>
                            <Text fontWeight={200}>Price of slRSV Token</Text>
                          </Container>
                          <Container>
                            <Text fontSize={20} fontWeight={600}>
                              ${homeData.stakePrice.toLocaleString()}
                            </Text>
                          </Container>
                        </VStack>
                      </SimpleGrid>
                    </Container>
                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <Input
                          type="number"
                          onChange={e => setStakeAmount(e.target.value)}
                          placeholder="Stake Amount"
                        />
                        <Button
                          colorScheme="blue"
                          onClick={onStakeModalOpen}
                        >
                          STAKE
                        </Button>
                      </SimpleGrid>
                    </Container>

                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <Input
                          type="number"
                          onChange={e => setUnstakeAmount(e.target.value)}
                          placeholder="Unstake Amount"
                        />
                        <Button
                          colorScheme="blue"
                          onClick={async () => {
                            await unstake(
                              unstakeAmount,
                              web3Provider,
                              connectedAccount
                            );
                          }}
                        >
                          UNSTAKE
                        </Button>
                      </SimpleGrid>
                    </Container>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </SimpleGrid>

            <Box mt={10}>
              <Card>
                <CardBody>
                  <SimpleGrid spacing={8}>
                    <Container>
                      <SimpleGrid columns={1} spacing={5}>
                        <VStack>
                          <Container>
                            <Text fontWeight={200}>RSV Token To Repay</Text>
                          </Container>
                          <Container>
                            <Text fontSize={20} fontWeight={600}>
                              {homeData.borrowValue.toLocaleString()}
                            </Text>
                          </Container>
                        </VStack>
                      </SimpleGrid>
                    </Container>
                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <Input
                          type="number"
                          placeholder="Borrow Amount"
                          onChange={e => setBorrowAmount(e.target.value)}
                        />
                        <Button
                          colorScheme="blue"
                          onClick={async () => {
                            await borrow(
                              borrowAmount,
                              web3Provider,
                              connectedAccount
                            );
                          }}
                        >
                          BORROW
                        </Button>
                      </SimpleGrid>
                    </Container>

                    <Container>
                      <SimpleGrid columns={2} spacing={5}>
                        <Input
                          type="number"
                          placeholder="Repay Amount"
                          onChange={e => setRepayAmount(e.target.value)}
                        />
                        <Button
                          colorScheme="blue"
                          onClick={onRepayModalOpen}
                        >
                          REPAY
                        </Button>
                      </SimpleGrid>
                    </Container>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </Box>
          </Box>
        </Box>
      ) : (
        <Center></Center>
      )}
    </ChakraProvider>
  );
}

export default App;
