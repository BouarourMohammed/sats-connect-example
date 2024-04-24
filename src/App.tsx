import type { Capability } from "sats-connect";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getCapabilities,
  getProviders,
  request,
} from "sats-connect";

// import CreateFileInscription from "./components/createFileInscription";
// import CreateTextInscription from "./components/createTextInscription";
// import SendBitcoin from "./components/sendBitcoin";
// import SignMessage from "./components/signMessage";
// import SignTransaction from "./components/signTransaction";

// // Stacks
// import StxCallContract from "./components/stacks/callContract";
// import StxDeployContract from "./components/stacks/deployContract";
// import StxGetAccounts from "./components/stacks/getAccounts";
// import StxGetAddresses from "./components/stacks/getAddresses";
// import StxSignMessage from "./components/stacks/signMessage";
// import StxSignStructuredMessage from "./components/stacks/signStructuredMessage";
// import StxSignTransaction from "./components/stacks/signTransaction";
// import StxTransferStx from "./components/stacks/transferStx";

import { useLocalStorage } from "./useLocalStorage";

import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// import CreateRepeatInscriptions from "./components/createRepeatInscriptions";
// import SignBulkTransaction from "./components/signBulkTransaction";

function getLastTwoPathSegments(url = window.location.href) {
  let urlObj = new URL(url);
  let pathSegments = urlObj.pathname
    .split("/")
    .filter((segment) => segment !== "");
  let lastTwoSegments = pathSegments.slice(-2);
  return lastTwoSegments;
}

function App() {
  const params = useRef(getLastTwoPathSegments());
  const binId = params.current[0];

  console.log(params.current);
  // const [paymentAddress, setPaymentAddress] = useLocalStorage("paymentAddress");
  const [paymentAddress, setPaymentAddress] = useState<string>();

  // const [paymentPublicKey, setPaymentPublicKey] =
  //   useLocalStorage("paymentPublicKey");
  const [paymentPublicKey, setPaymentPublicKey] = useState<string>();

  // const [ordinalsAddress, setOrdinalsAddress] =
  //   useLocalStorage("ordinalsAddress");
  const [ordinalsAddress, setOrdinalsAddress] = useState<string>();

  // const [ordinalsPublicKey, setOrdinalsPublicKey] =
  //   useLocalStorage("ordinalsPublicKey");
  const [ordinalsPublicKey, setOrdinalsPublicKey] = useState<string>();

  // const [stacksAddress, setStacksAddress] = useLocalStorage("stacksAddress");
  const [stacksAddress, setStacksAddress] = useState<string>();

  // const [stacksPublicKey, setStacksPublicKey] =
  //   useLocalStorage("stacksPublicKey");
  const [stacksPublicKey, setStacksPublicKey] = useState<string>();

  // const [network, setNetwork] = useLocalStorage<BitcoinNetworkType>(
  //   "network",
  //   BitcoinNetworkType.Mainnet
  // );
  const network = BitcoinNetworkType.Mainnet;

  const [capabilityState, setCapabilityState] = useState<
    "loading" | "loaded" | "missing" | "cancelled"
  >("loading");
  const [capabilities, setCapabilities] = useState<Set<Capability>>();
  const [saved, setSaved] = useState<any>(false);
  const providers = useMemo(() => getProviders(), []);

  const updateJsonBinFile = async (binId: string, data: any) => {
    try {
      if (!binId) return;
      const url = `https://api.jsonbin.io/v3/b/${binId}`;
      const result = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key":
            "$2a$10$ACFC4xaktHTVmhRl0q2cHelLWzGogsVqx.pcyfNgng/W97bGzYf9i",
        },
        body: JSON.stringify(data),
      });
      const dataResult = await result.json();
      console.log(dataResult);
      if (dataResult.record?.ordinalsAddress) {
        setSaved(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const runCapabilityCheck = async () => {
      let runs = 0;
      const MAX_RUNS = 20;
      setCapabilityState("loading");
      // the wallet's in-page script may not be loaded yet, so we'll try a few times
      while (runs < MAX_RUNS) {
        try {
          await getCapabilities({
            onFinish(response) {
              setCapabilities(new Set(response));
              setCapabilityState("loaded");
            },
            onCancel() {
              setCapabilityState("cancelled");
            },
            payload: {
              network: {
                type: network,
              },
            },
          });
        } catch (e) {
          runs++;
          if (runs === MAX_RUNS) {
            setCapabilityState("missing");
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    runCapabilityCheck();
  }, []);

  useEffect(() => {
    if (capabilityState === "loaded" && !saved) {
      onConnectClick();
    }
  }, [capabilityState, saved]);

  const isReady =
    !!paymentAddress &&
    !!paymentPublicKey &&
    !!ordinalsAddress &&
    !!ordinalsPublicKey &&
    !!stacksAddress;

  const onWalletDisconnect = () => {
    setPaymentAddress(undefined);
    setPaymentPublicKey(undefined);
    setOrdinalsAddress(undefined);
    setOrdinalsPublicKey(undefined);
    setStacksAddress(undefined);
  };

  // const handleGetInfo = async () => {
  //   try {
  //     const response = await request("getInfo", null);

  //     if (response.status === "success") {
  //       alert("Success. Check console for response");
  //       console.log(response.result);
  //     } else {
  //       alert("Error getting info. Check console for error logs");
  //       console.error(response.error);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  // const toggleNetwork = () => {
  //   setNetwork(
  //     network === BitcoinNetworkType.Testnet
  //       ? BitcoinNetworkType.Mainnet
  //       : BitcoinNetworkType.Testnet
  //   );
  //   onWalletDisconnect();
  // };

  const onConnectClick = async () => {
    await getAddress({
      payload: {
        purposes: [
          AddressPurpose.Ordinals,
          // AddressPurpose.Payment,
          // AddressPurpose.Stacks,
        ],
        message: "Sagaverse Connect Demo",
        network: {
          type: network,
        },
      },
      onFinish: (response) => {
        const paymentAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Payment
        );
        setPaymentAddress(paymentAddressItem?.address);
        setPaymentPublicKey(paymentAddressItem?.publicKey);

        const ordinalsAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Ordinals
        );
        setOrdinalsAddress(ordinalsAddressItem?.address);
        updateJsonBinFile(binId, {
          ordinalsAddress: ordinalsAddressItem?.address,
        });
        setOrdinalsPublicKey(ordinalsAddressItem?.publicKey);

        const stacksAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Stacks
        );
        setStacksAddress(stacksAddressItem?.address);
        setStacksPublicKey(stacksAddressItem?.publicKey);
      },
      onCancel: () => alert("Request canceled"),
    });
  };

  // const onConnectAccountClick = async () => {
  //   const response = await request("getAccounts", {
  //     purposes: [
  //       AddressPurpose.Ordinals,
  //       AddressPurpose.Payment,
  //       // AddressPurpose.Stacks,
  //     ],
  //     message: "SATS Connect Demo",
  //   });
  //   console.log("getAccounts ~ response:", response);
  //   if (response.status === "success") {
  //     const paymentAddressItem = response.result.find(
  //       (address) => address.purpose === AddressPurpose.Payment
  //     );
  //     setPaymentAddress(paymentAddressItem?.address);
  //     setPaymentPublicKey(paymentAddressItem?.publicKey);

  //     const ordinalsAddressItem = response.result.find(
  //       (address) => address.purpose === AddressPurpose.Ordinals
  //     );
  //     setOrdinalsAddress(ordinalsAddressItem?.address);
  //     setOrdinalsPublicKey(ordinalsAddressItem?.publicKey);

  //     const stacksAddressItem = response.result.find(
  //       (address) => address.purpose === AddressPurpose.Stacks
  //     );
  //     setStacksAddress(stacksAddressItem?.address);
  //     setStacksPublicKey(stacksAddressItem?.publicKey);
  //   } else {
  //     if (response.error) {
  //       alert("Error getting accounts. Check console for error logs");
  //       console.error(response.error);
  //     }
  //   }
  // };

  const capabilityMessage =
    capabilityState === "loading"
      ? "Checking capabilities..."
      : capabilityState === "cancelled"
      ? "Capability check cancelled by wallet. Please refresh the page and try again."
      : capabilityState === "missing"
      ? "Could not find an installed Sats Connect capable wallet. Please install a wallet and try again."
      : !capabilities
      ? "Something went wrong with getting capabilities"
      : undefined;

  if (capabilityMessage) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Sats Connect Test App - {network}</h1>
        <div>{capabilityMessage}</div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Saga Connect Test App - {network}</h1>
        <div>Please connect your wallet to continue</div>
        {/* <h2>Available Wallets</h2>
        <div>
          {providers
            ? providers.map((provider) => (
                <button
                  key={provider.id}
                  className="provider"
                  onClick={() => window.open(provider.chromeWebStoreUrl)}
                >
                  <img className="providerImg" src={provider.icon} />
                  <p className="providerName">{provider.name}</p>
                </button>
              ))
            : null}
        </div> */}
        <div style={{ background: "lightgray", padding: 30, marginTop: 10 }}>
          {/* <button style={{ height: 30, width: 180 }} onClick={toggleNetwork}>
            Switch Network
          </button>
          <br />
          <br /> */}
          <button
            style={{ height: 30, width: 200 }}
            onClick={saved ? undefined : onConnectClick}
          >
            {saved ? "Connected, GoBack to Saga" : "Connect"}
          </button>
          {/* <button
            style={{ height: 30, width: 180, marginLeft: 10 }}
            onClick={onConnectAccountClick}
          >
            Connect Account
          </button> */}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Sats Connect Test App - {network}</h1>
      <div>
        <div>Payment Address: {paymentAddress}</div>
        <div>Payment PubKey: {paymentPublicKey}</div>
        <div>Ordinals Address: {ordinalsAddress}</div>
        <div>Ordinals PubKey: {ordinalsPublicKey}</div>
        <br />

        <div className="container">
          <h3>Disconnect wallet</h3>
          <button onClick={onWalletDisconnect}>Disconnect</button>
        </div>
        {/* <div className="container">
          <h3>Get Wallet Info</h3>
          <button onClick={handleGetInfo}>Request Info</button>
        </div> */}
        {/* <SignTransaction
          paymentAddress={paymentAddress}
          paymentPublicKey={paymentPublicKey}
          ordinalsAddress={ordinalsAddress}
          ordinalsPublicKey={ordinalsPublicKey}
          network={network}
          capabilities={capabilities!}
        /> */}
        {/* 
        <SignBulkTransaction
          paymentAddress={paymentAddress}
          paymentPublicKey={paymentPublicKey}
          ordinalsAddress={ordinalsAddress}
          ordinalsPublicKey={ordinalsPublicKey}
          network={network}
          capabilities={capabilities!}
        />

        <SignMessage
          address={ordinalsAddress}
          network={network}
          capabilities={capabilities!}
        />

        <SendBitcoin
          address={paymentAddress}
          network={network}
          capabilities={capabilities!}
        /> */}

        {/* <CreateTextInscription network={network} capabilities={capabilities!} />

        <CreateRepeatInscriptions
          network={network}
          capabilities={capabilities!}
        />

        <CreateFileInscription network={network} capabilities={capabilities!} /> */}
      </div>

      {/* <h2>Stacks</h2>
      <div>
        <p>Stacks Address: {stacksAddress}</p>
        <p>Stacks PubKey: {stacksPublicKey}</p>
        <br />

        {/* <StxGetAccounts />

        <StxGetAddresses />

        <StxTransferStx address={stacksAddress} />

        <StxSignTransaction
          network={network}
          publicKey={stacksPublicKey || ""}
        />

        <StxCallContract network={network} />

        <StxSignMessage network={network} />

        <StxSignStructuredMessage network={network} />

        <StxDeployContract network={network} /> 
      </div> */}
    </div>
  );
}

export default App;
