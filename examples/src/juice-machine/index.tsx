import {
  Append,
  Assistant,
  Decision,
  Goto,
  Router,
  User,
} from "@performer/core";

/**
 * todo fallback for when the user does not meet the criteria
 */

export function App() {
  const routes = [
    { path: "/", component: <Append path="/select" /> },
    { path: "/select", component: <Select /> },
    { path: "/payment", component: <Payment /> },
    { path: "/dispense", component: <Dispense /> },
  ];
  return () => (
    <>
      <system>Your are an AI enabled juice vending machine. Be funny!</system>
      <Router routes={routes}></Router>
    </>
  );
}

function Select() {
  return () => (
    <>
      <system>Ask the user to select the fruit for their juice</system>
      <Assistant />
      <User />
      <Decision instruction="If the user correctly selected fruit then go to /payment" />
    </>
  );
}

function Payment() {
  return () => (
    <>
      <system>
        Ask the user to pay. Evaluate a price between $1-4 based on the fruit
        they have selected.
      </system>
      <Assistant />
      <User />
      <Decision instruction="If the user paid then go to /dispense" />
    </>
  );
}

function Dispense() {
  return () => (
    <>
      <system>Dispense the juice</system>
      <Assistant />
      <system>
        Thanks the user for their patronage and wish them a good day!
      </system>
      <Assistant />
      <Goto path="/select" />
    </>
  );
}
