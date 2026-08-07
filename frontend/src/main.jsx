import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App";
import "./index.css";


const root = ReactDOM.createRoot(
  document.getElementById("root")
);


root.render(
  <GoogleOAuthProvider
    clientId="982157239392-of4crmlsd85g4ogshdk74lstfp7l867g.apps.googleusercontent.com"
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
);