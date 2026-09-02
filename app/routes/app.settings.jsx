import { useState, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, Link } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { authenticateAdminOnceML } from "../utils/authCache.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";
import crypto from "crypto";

const BLUE_ML = "#073E74";
const GRAY_OFF_ML = "#707072";
const BORDER_ML = "#DBDBDB";
const LICENSE_BG_ML = "#EDEDED";
const LICENSE_BORDER_ML = "#E9E9EA";
const TEXT_DARK_ML = "#000000";
const TEXT_MUTED_ML = "#373737";

function generateSerialKeyML() {
  const randML = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SER-${Date.now()}-${randML}`;
}

function generateOidcClientIdML() {
  return `oidc_${crypto.randomBytes(16).toString("hex")}`;
}

function generateOidcClientSecretML() {
  return crypto.randomBytes(32).toString("hex");
}

export const loader = async ({ request: requestML }) => {
  const { session: sessionML } = await authenticateAdminOnceML(requestML);

  let settingsML = await db.shopSettings.findUnique({
    where: { shop: sessionML.shop },
  });

  if (!settingsML) {
    settingsML = await db.shopSettings.create({
      data: {
        shop: sessionML.shop,
        serialKey: generateSerialKeyML(),
        oidcClientId: generateOidcClientIdML(),
        oidcClientSecret: generateOidcClientSecretML(),
      },
    });
  } else if (!settingsML.serialKey || !settingsML.oidcClientId || !settingsML.oidcClientSecret) {
    settingsML = await db.shopSettings.update({
      where: { shop: sessionML.shop },
      data: {
        serialKey: settingsML.serialKey || generateSerialKeyML(),
        oidcClientId: settingsML.oidcClientId || generateOidcClientIdML(),
        oidcClientSecret: settingsML.oidcClientSecret || generateOidcClientSecretML(),
      },
    });
  }

  const storeHandleML = sessionML.shop.replace(".myshopify.com", "");
  const identityProvidersDeepLinkML = `https://admin.shopify.com/store/${storeHandleML}/settings/customer_accounts/authentication/identity_providers`;

  const hostML = requestML.headers.get("x-forwarded-host") || new URL(requestML.url).host;
  const defaultCallbackUrlsML = {
    google: `https://${hostML}/google/callback`,
    facebook: `https://${hostML}/facebook/callback`,
    twitter: `https://${hostML}/twitter/callback`,
    amazon: `https://${hostML}/amazon/callback`,
    linkedin: `https://${hostML}/linked/callback`,
  };
  const defaultWellKnownUrlML = `https://${hostML}/.well-known/openid-configuration`;

  return {
    settings: settingsML,
    registered: settingsML.registered,
    identityProvidersDeepLink: identityProvidersDeepLinkML,
    defaultCallbackUrls: defaultCallbackUrlsML,
    defaultWellKnownUrl: defaultWellKnownUrlML,
  };
};

const CLIENT_PROVIDERS_ML = ["google", "facebook", "twitter", "amazon", "linkedin"];

export const action = async ({ request: requestML }) => {
  const { session: sessionML } = await authenticate.admin(requestML);
  const formDataML = await requestML.formData();

  const clientDataML = {};
  CLIENT_PROVIDERS_ML.forEach((providerML) => {
    clientDataML[`${providerML}ClientId`] = formDataML.get(`${providerML}ClientId`) || null;
    clientDataML[`${providerML}ClientSecret`] = formDataML.get(`${providerML}ClientSecret`) || null;
    clientDataML[`${providerML}CallbackUrl`] = formDataML.get(`${providerML}CallbackUrl`) || null;
    const sortOrderRawML = formDataML.get(`${providerML}SortOrder`);
    if (sortOrderRawML !== null) {
      clientDataML[`${providerML}SortOrder`] = parseInt(sortOrderRawML, 10);
    }
  });

  const updatedML = await db.shopSettings.update({
    where: { shop: sessionML.shop },
    data: {
      appEnabled: formDataML.get("appEnabled") === "true",
      googleEnabled: formDataML.get("googleEnabled") === "true",
      twitterEnabled: formDataML.get("twitterEnabled") === "true",
      facebookEnabled: formDataML.get("facebookEnabled") === "true",
      linkedinEnabled: formDataML.get("linkedinEnabled") === "true",
      amazonEnabled: formDataML.get("amazonEnabled") === "true",
      oidcWellKnownUrl: formDataML.get("oidcWellKnownUrl") || null,
      smtpHost: formDataML.get("smtpHost") || null,
      smtpPort: formDataML.get("smtpPort") || null,
      smtpUser: formDataML.get("smtpUser") || null,
      smtpPass: formDataML.get("smtpPass") || null,
      smtpFromEmail: formDataML.get("smtpFromEmail") || null,
      ...clientDataML,
    },
  });

  return { settings: updatedML };
};

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.7797 9.82031H12.2463V14.4656H18.8382C18.5464 15.9609 17.6805 17.2266 16.3794 18.075C15.2887 18.7969 13.8966 19.2328 12.251 19.2328C9.0651 19.2328 6.36231 17.1281 5.39122 14.2922H5.37687L5.39122 14.2828C5.14725 13.5609 5.00374 12.7969 5.00374 12.0047C5.00374 11.2125 5.14725 10.4438 5.39122 9.72656C6.35753 6.89062 9.0651 4.78594 12.251 4.78594C14.0545 4.78594 15.657 5.39531 16.9391 6.57656L20.4455 3.14062C18.3168 1.19063 15.5518 0 12.2463 0C7.45778 0 3.32945 2.69531 1.31552 6.62344C0.478369 8.23594 0 10.0594 0 12C0 13.9406 0.478369 15.7641 1.31552 17.3766V17.3859C3.32945 21.3047 7.45778 24 12.2463 24C15.5518 24 18.3263 22.9312 20.3498 21.0984C22.6651 19.0031 23.9998 15.9281 23.9998 12.2719C24.0046 11.4234 23.928 10.6031 23.7797 9.82031Z" fill="#FC4C53"/>
      <path d="M5.39122 14.2922H5.37687L5.39122 14.2828C5.14725 13.5609 5.00374 12.7969 5.00374 12.0047C5.00374 11.2078 5.14725 10.4437 5.39122 9.72656C6.00354 7.93124 7.31427 6.43593 8.99334 5.57343C7.84047 4.07343 6.37188 2.99999 4.73107 2.54062C3.31032 3.63281 2.13353 5.02031 1.31073 6.61874C0.478369 8.23593 0 10.0594 0 12C0 13.9406 0.478369 15.7641 1.31552 17.3766V17.3859C2.6693 20.0109 4.97504 22.0875 7.78785 23.1703C8.96464 22.1156 9.92616 20.6859 10.5911 19.0125C8.1562 18.4312 6.18532 16.6172 5.39122 14.2922Z" fill="url(#paint0_radial_62_112)"/>
      <path d="M1.40649 17.55C3.44913 21.3797 7.52484 24 12.2463 24C15.5519 24 18.3264 22.9312 20.3499 21.0984C22.6652 19.0031 23.9999 15.9281 23.9999 12.2719C23.9999 12.0609 23.9807 11.864 23.9712 11.6578C21.1488 10.7484 17.915 10.4062 14.5377 10.8187C13.7532 10.9125 12.9974 11.0578 12.2511 11.2265V14.4656H18.8431C18.5513 15.9609 17.6854 17.2265 16.3842 18.075C15.2936 18.7969 13.9015 19.2328 12.2559 19.2328C9.06997 19.2328 6.36718 17.1281 5.39609 14.2922H5.38174L5.39609 14.2828C5.37218 14.2125 5.36261 14.1375 5.33869 14.0672C3.78399 15.0656 2.45891 16.2469 1.40649 17.55Z" fill="url(#paint1_radial_62_112)"/>
      <path d="M20.3499 21.0984C22.6652 19.0031 23.9999 15.9281 23.9999 12.2719C23.9999 11.4187 23.9233 10.6031 23.775 9.81561H12.2463V14.4609H18.8383C18.5465 15.9562 17.6806 17.2219 16.3794 18.0703C15.5949 18.5859 14.6525 18.9515 13.5762 19.1156L17.6758 22.8516C18.6708 22.3969 19.5702 21.8062 20.3499 21.0984Z" fill="url(#paint2_linear_62_112)"/>
      <defs>
        <radialGradient id="paint0_radial_62_112" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(2.94718 13.7154) scale(8.63391 11.4201)">
          <stop offset="0.368" stopColor="#FFCF09"/>
          <stop offset="0.718" stopColor="#FFCF09" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#FFCF09" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="paint1_radial_62_112" cx="0" cy="0" r="1" gradientTransform="matrix(17.4158 -2.13158 -1.65034 -12.9515 16.1867 23.7693)" gradientUnits="userSpaceOnUse">
          <stop offset="0.383" stopColor="#34A853"/>
          <stop offset="0.706" stopColor="#34A853" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#34A853" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="paint2_linear_62_112" x1="24.6984" y1="5.43444" x2="12.3041" y2="20.9679" gradientUnits="userSpaceOnUse">
          <stop offset="0.671" stopColor="#4285F4"/>
          <stop offset="0.885" stopColor="#4285F4" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#10539A"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.4574 10.1814H12.6858V11.2914C13.0068 10.653 13.83 10.0794 15.0666 10.0794C17.4372 10.0794 18 11.3502 18 13.6818V18H15.6V14.2128C15.6 12.885 15.279 12.1362 14.4618 12.1362C13.3284 12.1362 12.8574 12.9432 12.8574 14.2122V18H10.4574V10.1814ZM6.342 17.898H8.742V10.0794H6.342V17.898ZM9.0858 7.53C9.08589 7.73117 9.04599 7.93034 8.96843 8.11595C8.89087 8.30156 8.77719 8.46991 8.634 8.6112C8.49038 8.75407 8.32002 8.86724 8.13265 8.94425C7.94528 9.02126 7.74458 9.06059 7.542 9.06C7.13376 9.05908 6.74215 8.89817 6.4512 8.6118C6.30858 8.46999 6.19532 8.30145 6.1179 8.11582C6.04048 7.9302 6.00041 7.73113 6 7.53C6 7.1238 6.162 6.735 6.4518 6.4482C6.74202 6.16073 7.13411 5.99963 7.5426 6C7.9518 6 8.3442 6.1614 8.634 6.4482C8.9238 6.735 9.0858 7.1238 9.0858 7.53Z" fill="white"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12C24 5.37263 18.6274 0 12 0C5.37262 0 0 5.37263 0 12C0 17.9895 4.38825 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9705 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.3399 7.875 13.875 8.80003 13.875 9.74906V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9896 24 12Z" fill="#1877F2"/>
      <path d="M16.6711 15.4688L17.2031 12H13.875V9.74906C13.875 8.79994 14.3399 7.875 15.8306 7.875H17.3438V4.92188C17.3438 4.92188 15.9705 4.6875 14.6575 4.6875C11.9166 4.6875 10.125 6.34875 10.125 9.35625V12H7.07812V15.4688H10.125V23.8542C10.7453 23.9514 11.3722 24.0001 12 24C12.6278 24.0001 13.2547 23.9514 13.875 23.8542V15.4688H16.6711Z" fill="white"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="black"/>
      <mask id="mask0_62_205" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="4" y="4" width="16" height="16">
        <path d="M4.80005 4.79999H19.2V19.2H4.80005V4.79999Z" fill="white"/>
      </mask>
      <g mask="url(#mask0_62_205)">
        <path d="M16.14 5.47473H18.3484L13.5244 11.0023L19.2 18.5252H14.7566L11.2739 13.9635L7.29331 18.5252H5.08291L10.2422 12.611L4.80005 5.47576H9.35662L12.4999 9.64456L16.14 5.47473ZM15.3635 17.2004H16.5875L8.68805 6.73062H7.37559L15.3635 17.2004Z" fill="white"/>
      </g>
    </svg>
  );
}

function AmazonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#EBEBEB"/>
      <path d="M17.0588 16.6547C11.116 19.4813 7.42597 17.116 5.06346 15.6788C4.91721 15.5888 4.66971 15.7013 4.88346 15.9488C5.67378 16.9022 8.25003 19.2 11.6166 19.2C14.9832 19.2 16.9885 17.3635 17.2388 17.0428C17.4863 16.725 17.3091 16.5478 17.0588 16.6547ZM18.7266 15.7322C18.5663 15.5241 17.7563 15.4847 17.2444 15.5494C16.7325 15.6113 15.9647 15.9235 16.0322 16.1091C16.066 16.1794 16.1363 16.1485 16.4879 16.1175C16.8394 16.0838 17.8266 15.9572 18.0319 16.2272C18.2372 16.4972 17.7169 17.7853 17.6213 17.9935C17.5285 18.2016 17.655 18.255 17.8294 18.1172C18.001 17.9794 18.3075 17.6194 18.5157 17.1131C18.7238 16.6013 18.8475 15.8897 18.7266 15.7322Z" fill="#FF6200"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M16.4514 13.7606C16.1027 13.2769 15.7343 12.8859 15.7343 11.9944V9.02438C15.7343 7.76718 15.8243 6.61406 14.8961 5.7478C14.1649 5.04749 12.9555 4.79999 12.0274 4.79999C10.2161 4.79999 8.19393 5.47499 7.76643 7.71656C7.72424 7.95562 7.8958 8.08219 8.05049 8.11594L9.89831 8.31281C10.0699 8.30437 10.1964 8.13562 10.2274 7.96406C10.3849 7.19062 11.0346 6.81937 11.7602 6.81937C12.1511 6.81937 12.5955 6.96281 12.8289 7.31437C13.0933 7.70531 13.0596 8.2425 13.0596 8.69531V8.94281C11.9542 9.06656 10.5114 9.14813 9.47643 9.60375C8.28393 10.1184 7.4458 11.1703 7.4458 12.7172C7.4458 14.6972 8.69455 15.6872 10.2977 15.6872C11.6561 15.6872 12.393 15.3666 13.4392 14.3006C13.788 14.8041 13.9005 15.046 14.5333 15.5719C14.6739 15.6478 14.8568 15.6394 14.9833 15.5269L14.9861 15.5325C15.3658 15.195 16.0577 14.5903 16.4458 14.2669C16.6005 14.1375 16.5752 13.9322 16.4514 13.7606ZM12.7052 12.9028C12.4014 13.44 11.9233 13.7691 11.3861 13.7691C10.6549 13.7691 10.2274 13.2122 10.2274 12.3881C10.2274 10.7653 11.6814 10.47 13.0596 10.47V10.8834H13.0624C13.0624 11.6259 13.0821 12.2447 12.7052 12.9028Z" fill="black"/>
    </svg>
  );
}

const DEFAULT_ICONS_ML = {
  google: GoogleIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  amazon: AmazonIcon,
};

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.7498 12.45V0.75M7.0498 3.9L9.7498 0.75L12.4498 3.9" stroke="#073E74" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.15 18.75H13.35C15.8952 18.75 17.1687 18.75 17.9589 17.9598C18.75 17.1678 18.75 15.8961 18.75 13.35V12.45C18.75 9.90476 18.75 8.63216 17.9589 7.84106C17.2677 7.14986 16.2075 7.06256 14.25 7.05176M5.25 7.05176C3.2925 7.06256 2.2323 7.14986 1.5411 7.84106C0.75 8.63216 0.75 9.90476 0.75 12.45V13.35C0.75 15.8961 0.75 17.1687 1.5411 17.9598C1.8111 18.2298 2.1369 18.4071 2.55 18.5241" stroke="#073E74" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4" cy="3" r="1.5" fill={GRAY_OFF_ML} />
      <circle cx="10" cy="3" r="1.5" fill={GRAY_OFF_ML} />
      <circle cx="4" cy="10" r="1.5" fill={GRAY_OFF_ML} />
      <circle cx="10" cy="10" r="1.5" fill={GRAY_OFF_ML} />
      <circle cx="4" cy="17" r="1.5" fill={GRAY_OFF_ML} />
      <circle cx="10" cy="17" r="1.5" fill={GRAY_OFF_ML} />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.75 2.45962C8.66153 2.16968 9.6604 2 10.75 2C14.9319 2 17.778 4.49956 19.4751 6.70433C20.325 7.80853 20.75 8.3606 20.75 10C20.75 11.6394 20.325 12.1915 19.4751 13.2957C17.778 15.5004 14.9319 18 10.75 18C6.56811 18 3.72196 15.5004 2.02489 13.2957C1.17496 12.1915 0.75 11.6394 0.75 10C0.75 8.3606 1.17496 7.80853 2.02489 6.70433C2.50612 6.07914 3.07973 5.43025 3.75 4.82137"
        stroke={BLUE_ML}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.75 10C13.75 11.6569 12.4069 13 10.75 13C9.0931 13 7.75 11.6569 7.75 10C7.75 8.3431 9.0931 7 10.75 7C12.4069 7 13.75 8.3431 13.75 10Z"
        stroke={BLUE_ML}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.75 2.45962C8.66153 2.16968 9.6604 2 10.75 2C14.9319 2 17.778 4.49956 19.4751 6.70433C20.325 7.80853 20.75 8.3606 20.75 10C20.75 11.6394 20.325 12.1915 19.4751 13.2957C17.778 15.5004 14.9319 18 10.75 18C6.56811 18 3.72196 15.5004 2.02489 13.2957C1.17496 12.1915 0.75 11.6394 0.75 10C0.75 8.3606 1.17496 7.80853 2.02489 6.70433C2.50612 6.07914 3.07973 5.43025 3.75 4.82137"
        stroke={BLUE_ML}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.75 10C13.75 11.6569 12.4069 13 10.75 13C9.0931 13 7.75 11.6569 7.75 10C7.75 8.3431 9.0931 7 10.75 7C12.4069 7 13.75 8.3431 13.75 10Z"
        stroke={BLUE_ML}
        strokeWidth="1.5"
      />
      <path
        d="M1.75 1.5L19.75 18.5"
        stroke={BLUE_ML}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6.75" y="6.75" width="9" height="9" rx="1.5" stroke={GRAY_OFF_ML} strokeWidth="1.4" />
      <path
        d="M4.5 11.25H3.75C3.05964 11.25 2.5 10.6904 2.5 10V3.75C2.5 3.05964 3.05964 2.5 3.75 2.5H10C10.6904 2.5 11.25 3.05964 11.25 3.75V4.5"
        stroke={GRAY_OFF_ML}
        strokeWidth="1.4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 9.5L7.25 12.75L14 5.5"
        stroke="#1F8A3D"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      style={{
        width: "46px",
        height: "24px",
        borderRadius: "110px",
        border: "none",
        padding: 0,
        position: "relative",
        background: checked ? BLUE_ML : GRAY_OFF_ML,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3.5px",
          left: checked ? "25px" : "4px",
          width: "17px",
          height: "17px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

const stylesML = {
  outerCard: {
    border: `1px solid ${BORDER_ML}`,
    borderRadius: "8px",
    background: "#fff",
    padding: "16px",
  },
  lockWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "48px 24px",
    gap: "12px",
  },
  lockTitle: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "18px",
    color: TEXT_DARK_ML,
    margin: 0,
  },
  lockDescription: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: "14px",
    color: TEXT_MUTED_ML,
    margin: 0,
    maxWidth: "360px",
  },
  lockButton: {
    marginTop: "8px",
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 20px",
    background: BLUE_ML,
    borderRadius: "8px",
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "14px",
    textDecoration: "none",
  },
  headerRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    rowGap: "12px",
    columnGap: "10px",
    marginBottom: "16px",
  },
  heading: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "18px",
    letterSpacing: "0.02em",
    color: TEXT_DARK_ML,
    margin: 0,
  },
  subtitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "3px",
  },
  subtitleText: {
    fontFamily: "Inter",
    fontSize: "12px",
    color: TEXT_DARK_ML,
  },
  innerCard: {
    border: `1px solid ${BORDER_ML}`,
    borderRadius: "8px",
    background: "#fff",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  licenseBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "10px",
    background: LICENSE_BG_ML,
    border: `1px solid ${LICENSE_BORDER_ML}`,
    borderRadius: "4px",
  },
  licenseTitle: {
    fontFamily: "Inter",
    fontSize: "16px",
    fontWeight: 500,
    color: TEXT_DARK_ML,
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${BORDER_ML}`,
    margin: 0,
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: 500,
    color: TEXT_DARK_ML,
  },
  subLabel: {
    fontFamily: "Inter",
    fontSize: "12px",
    fontWeight: 400,
    color: TEXT_MUTED_ML,
    marginTop: "4px",
  },
  serialPill: {
    padding: "4px 10px",
    background: "#000000",
    borderRadius: "4px",
    color: "#fff",
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: 500,
  },
  providersBox: {
    background: "#fff",
    border: `1px solid ${BORDER_ML}`,
    borderRadius: "4px",
    padding: "10px 10px 13px",
  },
  providerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 10px",
  },
  providerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoPreview: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  uploadIconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    flexShrink: 0,
  },
  resetBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    fontSize: "13px",
    lineHeight: 1,
    color: GRAY_OFF_ML,
    cursor: "pointer",
    userSelect: "none",
  },
  tabBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "8px",
    border: `1px solid ${BORDER_ML}`,
    borderRadius: "10px",
    background: "#fff",
    marginBottom: "16px",
  },
  clientCard: {
    border: `1px solid ${LICENSE_BORDER_ML}`,
    borderRadius: "4px",
    background: "#fff",
    marginBottom: "10px",
    overflow: "hidden",
  },
  clientCardHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
  },
  manageProvidersButton: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "6px",
    border: "1px solid #353535",
    background: "linear-gradient(180deg, #1C1C1C 0%, #404040 100%)",
    color: "#fff",
    fontFamily: "Inter",
    fontSize: "13px",
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  clientCardTitle: {
    fontFamily: "Inter",
    fontSize: "16px",
    fontWeight: 600,
    color: TEXT_DARK_ML,
  },
  devDashboardLink: {
    fontFamily: "Inter",
    fontSize: "12px",
    fontWeight: 500,
    color: BLUE_ML,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  clientCardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "10px",
  },
  clientDivider: {
    border: "none",
    borderTop: `1px solid ${BORDER_ML}`,
    width: "100%",
  },
  clientFieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  clientFieldLabel: {
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: 500,
    color: TEXT_MUTED_ML,
  },
  clientInput: {
    width: "100%",
    padding: "7px 8px",
    borderRadius: "4px",
    border: `1px solid ${BORDER_ML}`,
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: TEXT_DARK_ML,
    boxSizing: "border-box",
  },
  secretInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  secretInput: {
    width: "100%",
    padding: "7px 34px 7px 8px",
    borderRadius: "4px",
    border: `1px solid ${BORDER_ML}`,
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: TEXT_DARK_ML,
    boxSizing: "border-box",
  },
  secretToggleButton: {
    position: "absolute",
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  linkInputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  linkInput: {
    width: "100%",
    padding: "7px 40px 7px 8px",
    borderRadius: "4px",
    border: `1px solid ${BORDER_ML}`,
    fontFamily: "Inter",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: TEXT_MUTED_ML,
    background: LICENSE_BG_ML,
    boxSizing: "border-box",
    cursor: "default",
    outline: "none",
  },
  copyButton: {
    position: "absolute",
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "26px",
    height: "26px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    borderRadius: "4px",
  },
  dragHandle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    flexShrink: 0,
  },
};

function tabButtonStyleML(activeML) {
  return {
    flex: "0 1 auto",
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    background: activeML ? BLUE_ML : "#ECECEC",
    color: activeML ? "#fff" : TEXT_DARK_ML,
  };
}

function saveWrapperStyleML() {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2px",
    borderRadius: "8px",
    flex: "0 1 136px",
    minWidth: "120px",
    height: "42px",
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #2A2A2A 0%, #000000 100%)",
  };
}

function saveButtonStyleML(disabledML) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "38px",
    boxSizing: "border-box",
    padding: "7px 10px",
    borderRadius: "6px",
    border: "1px solid #353535",
    background: "linear-gradient(180deg, #1C1C1C 0%, #404040 100%)",
    color: "#fff",
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: "19px",
    cursor: disabledML ? "default" : "pointer",
  };
}

const tabNavRowStyleML = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "20px",
};

function backNavButtonStyleML(disabledML) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 20px",
    borderRadius: "8px",
    border: `1px solid ${BORDER_ML}`,
    background: LICENSE_BG_ML,
    color: disabledML ? "#A6A6A6" : TEXT_DARK_ML,
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "14px",
    cursor: disabledML ? "default" : "pointer",
    opacity: disabledML ? 0.6 : 1,
  };
}

function nextNavButtonStyleML(disabledML) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    background: BLUE_ML,
    color: "#fff",
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "14px",
    cursor: disabledML ? "default" : "pointer",
    opacity: disabledML ? 0.6 : 1,
  };
}

function ChevronLeftIconML() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIconML() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TabNavRowML({ onBackML, onNextML, isFirstML, isLastML }) {
  return (
    <div style={tabNavRowStyleML}>
      <button
        type="button"
        style={backNavButtonStyleML(isFirstML)}
        disabled={isFirstML}
        onClick={onBackML}
      >
        <ChevronLeftIconML />
        Back
      </button>
      <button
        type="button"
        style={nextNavButtonStyleML(isLastML)}
        disabled={isLastML}
        onClick={onNextML}
      >
        Next
        <ChevronRightIconML />
      </button>
    </div>
  );
}

function LogoUploadButton({ providerKey, enabled, hasCustomLogo }) {
  const uploadFetcherML = useFetcher();
  const resetFetcherML = useFetcher();

  const isUploadingML = uploadFetcherML.state !== "idle";
  const isResettingML = resetFetcherML.state !== "idle";
  const disabledML = !enabled || isUploadingML;

  const handleFileChangeML = (eML) => {
    const fileML = eML.target.files?.[0];
    if (!fileML) return;

    const formDataML = new FormData();
    formDataML.set("provider", providerKey);
    formDataML.set("file", fileML);

    uploadFetcherML.submit(formDataML, {
      method: "POST",
      action: "/app/settings/upload-logo",
      encType: "multipart/form-data",
    });

    eML.target.value = "";
  };

  const handleResetML = () => {
    const formDataML = new FormData();
    formDataML.set("provider", providerKey);
    formDataML.set("intent", "reset");

    resetFetcherML.submit(formDataML, {
      method: "POST",
      action: "/app/settings/upload-logo",
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {hasCustomLogo && enabled && (
        <span
          style={{ ...stylesML.resetBtn, opacity: isResettingML ? 0.5 : 1 }}
          onClick={isResettingML ? undefined : handleResetML}
          title="Reset to default logo"
        >
          ✕
        </span>
      )}
      <label
        style={{
          ...stylesML.uploadIconBtn,
          opacity: disabledML ? 0.4 : 1,
          cursor: disabledML ? "default" : "pointer",
        }}
        title={enabled ? "Upload new logo (PNG, JPG or SVG)" : "Enable this provider to customize its logo"}
      >
        <UploadIcon />
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={handleFileChangeML}
          disabled={disabledML}
          style={{ display: "none" }}
        />
      </label>
    </div>
  );
}

function ProviderRow({ providerKey, name, subtitle, checked, onToggle, logoUrl }) {
  const DefaultIconML = DEFAULT_ICONS_ML[providerKey];

  return (
    <div style={stylesML.providerRow}>
      <div style={stylesML.providerLeft}>
        <div style={stylesML.logoPreview}>
          {logoUrl ? (
            <img src={logoUrl} alt={`${name} logo`} style={stylesML.logoPreviewImg} />
          ) : (
            <DefaultIconML />
          )}
        </div>
        <div>
          <div style={stylesML.label}>{name}</div>
          {subtitle && <div style={stylesML.subLabel}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <LogoUploadButton providerKey={providerKey} enabled={checked} hasCustomLogo={!!logoUrl} />
        <ToggleSwitch checked={checked} onChange={onToggle} />
      </div>
    </div>
  );
}

const PROVIDER_NAMES_ML = {
  google: "Google",
  facebook: "Facebook",
  twitter: "X (Twitter)",
  amazon: "Amazon",
  linkedin: "Linkedin",
};

const PROVIDER_DEV_DASHBOARD_LINKS_ML = {
  google: "https://console.cloud.google.com/apis/credentials",
  facebook: "https://developers.facebook.com/apps",
  twitter: "https://developer.x.com/en/portal/dashboard",
  amazon: "https://developer.amazon.com/settings/console/registration",
  linkedin: "https://www.linkedin.com/developers/apps",
};

function OidcSettingsCard({ valuesML, identityProvidersDeepLinkML }) {
  const [copiedFieldML, setCopiedFieldML] = useState(null);

  const handleCopyML = async (fieldML, textML) => {
    try {
      await navigator.clipboard.writeText(textML || "");
    } catch {
    }
    setCopiedFieldML(fieldML);
    setTimeout(() => setCopiedFieldML((prevML) => (prevML === fieldML ? null : prevML)), 1500);
  };

  return (
    <div style={stylesML.clientCard}>
      <div style={stylesML.clientCardBody}>
        <div style={stylesML.clientCardHeader}>
          <div style={stylesML.clientCardTitle}>Shopify Customer Accounts</div>
          {identityProvidersDeepLinkML && (
            <a
              href={identityProvidersDeepLinkML}
              target="_blank"
              rel="noreferrer"
              style={stylesML.manageProvidersButton}
            >
              Manage Providers
            </a>
          )}
        </div>

        <div style={stylesML.subLabel}>
          This is the pair that Shopify uses to authenticate itself to this app — not tied to any
          social provider. It's generated automatically when the app is installed and can't be
          changed. Copy the Client ID, Client Secret and Well-known or discovery endpoint URL below
          into your store's Manage Providers page under Settings → Customer accounts → Authentication.
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>Client ID</div>
          <div style={stylesML.linkInputWrap}>
            <input
              type="text"
              readOnly
              style={stylesML.linkInput}
              value={valuesML.clientId}
            />
            <button
              type="button"
              style={stylesML.copyButton}
              onClick={() => handleCopyML("clientId", valuesML.clientId)}
              aria-label="Copy client ID"
              title={copiedFieldML === "clientId" ? "Copied!" : "Copy"}
            >
              {copiedFieldML === "clientId" ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>Client Secret</div>
          <div style={stylesML.secretInputWrap}>
            <input
              type="text"
              readOnly
              autoComplete="off"
              style={{ ...stylesML.secretInput, ...stylesML.linkInput }}
              value={valuesML.clientSecret}
            />
            <button
              type="button"
              style={stylesML.copyButton}
              onClick={() => handleCopyML("clientSecret", valuesML.clientSecret)}
              aria-label="Copy client secret"
              title={copiedFieldML === "clientSecret" ? "Copied!" : "Copy"}
            >
              {copiedFieldML === "clientSecret" ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>Well-known or discovery endpoint URL</div>
          <div style={stylesML.linkInputWrap}>
            <input
              type="text"
              readOnly
              style={stylesML.linkInput}
              value={valuesML.wellKnownUrl}
            />
            <button
              type="button"
              style={stylesML.copyButton}
              onClick={() => handleCopyML("wellKnownUrl", valuesML.wellKnownUrl)}
              aria-label="Copy well-known URL"
              title={copiedFieldML === "wellKnownUrl" ? "Copied!" : "Copy"}
            >
              {copiedFieldML === "wellKnownUrl" ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmtpSettingsCard({ valuesML, onFieldChangeML }) {
  const [showPassML, setShowPassML] = useState(false);

  return (
    <div style={stylesML.clientCard}>
      <div style={stylesML.clientCardBody}>
        <div style={stylesML.clientCardHeader}>
          <div style={stylesML.clientCardTitle}>Email (SMTP) Settings</div>
        </div>

        <div style={stylesML.subLabel}>
          Used to send the email login verification code to your customers. Enter your SMTP
          provider's details below.
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>SMTP Host</div>
          <input
            type="text"
            style={stylesML.clientInput}
            value={valuesML.host}
            onChange={(eML) => onFieldChangeML("host", eML.target.value)}
            placeholder="Enter SMTP Host"
          />
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>SMTP Port</div>
          <input
            type="text"
            style={stylesML.clientInput}
            value={valuesML.port}
            onChange={(eML) => onFieldChangeML("port", eML.target.value)}
            placeholder="Enter SMTP Port"
          />
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>SMTP Username</div>
          <input
            type="text"
            style={stylesML.clientInput}
            value={valuesML.user}
            onChange={(eML) => onFieldChangeML("user", eML.target.value)}
            placeholder="Enter SMTP Username"
          />
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>SMTP Password</div>
          <div style={stylesML.secretInputWrap}>
            <input
              type={showPassML ? "text" : "password"}
              autoComplete="off"
              style={stylesML.secretInput}
              value={valuesML.pass}
              onChange={(eML) => onFieldChangeML("pass", eML.target.value)}
              placeholder="Enter SMTP Password"
            />
            <button
              type="button"
              style={stylesML.secretToggleButton}
              onClick={() => setShowPassML((prevML) => !prevML)}
              aria-label={showPassML ? "Hide SMTP password" : "Show SMTP password"}
              title={showPassML ? "Hide" : "Show"}
            >
              {showPassML ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>From Email</div>
          <input
            type="text"
            style={stylesML.clientInput}
            value={valuesML.fromEmail}
            onChange={(eML) => onFieldChangeML("fromEmail", eML.target.value)}
            placeholder="Enter From Email"
          />
        </div>
      </div>
    </div>
  );
}

function ClientSettingsCard({
  providerKey,
  positionML,
  valuesML,
  onFieldChangeML,
  onDragStartML,
  onDragOverML,
  onDropML,
  onDragEndML,
  isDraggingML,
}) {
  const DefaultIconML = DEFAULT_ICONS_ML[providerKey];
  const [showSecretML, setShowSecretML] = useState(false);
  const [copiedML, setCopiedML] = useState(false);
  const dragAllowedRef = useRef(false);

  const handleCopyML = async () => {
    try {
      await navigator.clipboard.writeText(valuesML.callbackUrl || "");
    } catch {
    }
    setCopiedML(true);
    setTimeout(() => setCopiedML(false), 1500);
  };

  return (
    <div
      style={{ ...stylesML.clientCard, opacity: isDraggingML ? 0.5 : 1 }}
      draggable
      onDragStart={(eML) => {
        if (!dragAllowedRef.current) {
          eML.preventDefault();
          return;
        }
        onDragStartML(eML);
      }}
      onDragOver={onDragOverML}
      onDrop={onDropML}
      onDragEnd={(eML) => {
        dragAllowedRef.current = false;
        onDragEndML(eML);
      }}
    >
      <div style={stylesML.clientCardBody}>
        <div style={stylesML.clientCardHeader}>
          <span
            style={stylesML.dragHandle}
            title="Drag to reorder"
            onMouseDown={() => {
              dragAllowedRef.current = true;
            }}
            onMouseUp={() => {
              dragAllowedRef.current = false;
            }}
          >
            <GripIcon />
          </span>
          <div style={stylesML.logoPreview}>
            <DefaultIconML />
          </div>
          <div style={stylesML.clientCardTitle}>{PROVIDER_NAMES_ML[providerKey]}</div>
          {PROVIDER_DEV_DASHBOARD_LINKS_ML[providerKey] && (
            <a
              href={PROVIDER_DEV_DASHBOARD_LINKS_ML[providerKey]}
              target="_blank"
              rel="noreferrer"
              style={stylesML.devDashboardLink}
            >
              Get Client ID &amp; Secret ↗
            </a>
          )}
          <div style={{ marginLeft: "auto", ...stylesML.subLabel }}>
            Sort order: {positionML}
          </div>
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>Client ID</div>
          <input
            type="text"
            style={stylesML.clientInput}
            value={valuesML.clientId}
            onChange={(eML) => onFieldChangeML(providerKey, "clientId", eML.target.value)}
            placeholder={`Enter ${PROVIDER_NAMES_ML[providerKey]} Client ID`}
          />
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>Client Secret</div>
          <div style={stylesML.secretInputWrap}>
            <input
              type={showSecretML ? "text" : "password"}
              autoComplete="off"
              style={stylesML.secretInput}
              value={valuesML.clientSecret}
              onChange={(eML) => onFieldChangeML(providerKey, "clientSecret", eML.target.value)}
              placeholder={`Enter ${PROVIDER_NAMES_ML[providerKey]} Client Secret`}
            />
            <button
              type="button"
              style={stylesML.secretToggleButton}
              onClick={() => setShowSecretML((prevML) => !prevML)}
              aria-label={showSecretML ? "Hide client secret" : "Show client secret"}
              title={showSecretML ? "Hide" : "Show"}
            >
              {showSecretML ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div style={stylesML.clientDivider} />

        <div style={stylesML.clientFieldGroup}>
          <div style={stylesML.clientFieldLabel}>Redirect URL</div>
          <div style={stylesML.linkInputWrap}>
            <input
              type="text"
              readOnly //remove when to write
              style={stylesML.linkInput}
              value={valuesML.callbackUrl}
              //onChange={(eML) => onFieldChangeML(providerKey, "callbackUrl", eML.target.value)}
            />
            <button
              type="button"
              style={stylesML.copyButton}
              onClick={handleCopyML}
              aria-label="Copy redirect URL"
              title={copiedML ? "Copied!" : "Copy"}
            >
              {copiedML ? <CheckIcon /> : <CopyIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPreviewModal({ values, settings, onClose }) {
  const logosML = {
    google: settings.googleLogo,
    linkedin: settings.linkedinLogo,
    facebook: settings.facebookLogo,
    twitter: settings.twitterLogo,
    amazon: settings.amazonLogo,
  };

  const previewIconStyleML = {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    overflow: "hidden",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "24px",
          width: "380px",
          maxWidth: "90vw",
          boxSizing: "border-box",
          textAlign: "center",
          position: "relative",
        }}
        onClick={(eML) => eML.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            border: "none",
            background: "none",
            fontSize: "18px",
            cursor: "pointer",
            color: "#707072",
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: "12px", color: "#707072", marginBottom: "16px", fontFamily: "Inter" }}>
          Storefront Login Preview
        </div>

        <h2 style={{ fontSize: "28px", fontWeight: 400, marginBottom: "24px" }}>Login</h2>

        <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "14px", marginBottom: "16px", color: "#999", fontSize: "15px", textAlign: "left" }}>
          Email
        </div>
        <div style={{ background: "#1a1a1a", color: "#fff", borderRadius: "4px", padding: "14px", fontSize: "15px", fontWeight: 600, marginBottom: "24px" }}>
          Continue
        </div>

        <div style={{ color: "#999", fontSize: "13px", marginBottom: "16px" }}>OR</div>

        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "14px" }}>
          {values.googleEnabled && (
            <div style={previewIconStyleML} title="Google">
              {logosML.google ? <img src={logosML.google} alt="Google" width="24" height="24" style={{ objectFit: "cover" }} /> : <GoogleIcon />}
            </div>
          )}
          {values.linkedinEnabled && (
            <div style={previewIconStyleML} title="LinkedIn">
              {logosML.linkedin ? <img src={logosML.linkedin} alt="LinkedIn" width="24" height="24" style={{ objectFit: "cover" }} /> : <LinkedInIcon />}
            </div>
          )}
          {values.facebookEnabled && (
            <div style={previewIconStyleML} title="Facebook">
              {logosML.facebook ? <img src={logosML.facebook} alt="Facebook" width="24" height="24" style={{ objectFit: "cover" }} /> : <FacebookIcon />}
            </div>
          )}
          {values.twitterEnabled && (
            <div style={previewIconStyleML} title="X (Twitter)">
              {logosML.twitter ? <img src={logosML.twitter} alt="X" width="24" height="24" style={{ objectFit: "cover" }} /> : <XIcon />}
            </div>
          )}
          {values.amazonEnabled && (
            <div style={previewIconStyleML} title="Amazon">
              {logosML.amazon ? <img src={logosML.amazon} alt="Amazon" width="24" height="24" style={{ objectFit: "cover" }} /> : <AmazonIcon />}
            </div>
          )}
        </div>

        {!values.appEnabled && (
          <div style={{ marginTop: "16px", fontSize: "12px", color: "#d82c0d" }}>
            App is currently disabled — no providers will show on the storefront.
          </div>
        )}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="15" width="30" height="20" rx="3" stroke={BLUE_ML} strokeWidth="1.8" />
      <path d="M7 15V9C7 4.58172 10.5817 1 15 1H17C21.4183 1 25 4.58172 25 9V15" stroke={BLUE_ML} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="24" r="2.4" fill={BLUE_ML} />
      <path d="M16 26.4V29.4" stroke={BLUE_ML} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function buildClientValuesML(settingsML, defaultCallbackUrlsML = {}) {
  const resultML = {};
  CLIENT_PROVIDERS_ML.forEach((providerML) => {
    resultML[providerML] = {
      clientId: settingsML[`${providerML}ClientId`] || "",
      clientSecret: settingsML[`${providerML}ClientSecret`] || "",
      callbackUrl: settingsML[`${providerML}CallbackUrl`] || defaultCallbackUrlsML[providerML] || "",
      sortOrder: settingsML[`${providerML}SortOrder`] ?? 1,
    };
  });
  return resultML;
}

function buildOrderML(settingsML) {
  return [...CLIENT_PROVIDERS_ML].sort(
    (aML, bML) => (settingsML[`${aML}SortOrder`] ?? 1) - (settingsML[`${bML}SortOrder`] ?? 1)
  );
}

export default function Settings() {
  const {
    settings: settingsML,
    registered: registeredML,
    identityProvidersDeepLink: identityProvidersDeepLinkML,
    defaultCallbackUrls: defaultCallbackUrlsML,
    defaultWellKnownUrl: defaultWellKnownUrlML,
  } = useLoaderData();
  const fetcherML = useFetcher();
  const shopifyML = useAppBridge();
  const [showPreviewML, setShowPreviewML] = useState(false);
  const [activeTabML, setActiveTabML] = useState("general");
  const tabOrderML = ["general", "client", "smtp"];
  const activeTabIndexML = tabOrderML.indexOf(activeTabML);
  const goBackTabML = () => {
    if (activeTabIndexML > 0) setActiveTabML(tabOrderML[activeTabIndexML - 1]);
  };
  const goNextTabML = () => {
    if (activeTabIndexML < tabOrderML.length - 1) setActiveTabML(tabOrderML[activeTabIndexML + 1]);
  };

  const [valuesML, setValuesML] = useState({
    appEnabled: settingsML.appEnabled,
    googleEnabled: settingsML.googleEnabled,
    twitterEnabled: settingsML.twitterEnabled,
    facebookEnabled: settingsML.facebookEnabled,
    linkedinEnabled: settingsML.linkedinEnabled,
    amazonEnabled: settingsML.amazonEnabled,
  });

  const [clientValuesML, setClientValuesML] = useState(() => buildClientValuesML(settingsML, defaultCallbackUrlsML));
  const [orderML, setOrderML] = useState(() => buildOrderML(settingsML));
  const [oidcValuesML, setOidcValuesML] = useState({
    clientId: settingsML.oidcClientId || "",
    clientSecret: settingsML.oidcClientSecret || "",
    wellKnownUrl: settingsML.oidcWellKnownUrl || defaultWellKnownUrlML || "",
  });
  const [smtpValuesML, setSmtpValuesML] = useState({
    host: settingsML.smtpHost || "",
    port: settingsML.smtpPort || "",
    user: settingsML.smtpUser || "",
    pass: settingsML.smtpPass || "",
    fromEmail: settingsML.smtpFromEmail || "",
  });
  const dragIndexRef = useRef(null);
  const [draggingIndexML, setDraggingIndexML] = useState(null);

  const isGeneralDirtyML = Object.keys(valuesML).some((keyML) => valuesML[keyML] !== settingsML[keyML]);
  const isClientDirtyML =
    JSON.stringify(clientValuesML) !== JSON.stringify(buildClientValuesML(settingsML, defaultCallbackUrlsML)) ||
    JSON.stringify(orderML) !== JSON.stringify(buildOrderML(settingsML)) ||
    oidcValuesML.wellKnownUrl !== (settingsML.oidcWellKnownUrl || defaultWellKnownUrlML || "");
  const isSmtpDirtyML =
    smtpValuesML.host !== (settingsML.smtpHost || "") ||
    smtpValuesML.port !== (settingsML.smtpPort || "") ||
    smtpValuesML.user !== (settingsML.smtpUser || "") ||
    smtpValuesML.pass !== (settingsML.smtpPass || "") ||
    smtpValuesML.fromEmail !== (settingsML.smtpFromEmail || "");
  const isDirtyML = isGeneralDirtyML || isClientDirtyML || isSmtpDirtyML;
  const isSavingML = fetcherML.state !== "idle";

  useEffect(() => {
    if (fetcherML.data?.settings) {
      shopifyML.toast.show("Settings saved");
    }
  }, [fetcherML.data, shopifyML]);

  const toggleML = (keyML) => {
    setValuesML((prevML) => ({ ...prevML, [keyML]: !prevML[keyML] }));
  };

  const handleClientFieldChangeML = (providerKeyML, fieldML, valML) => {
    setClientValuesML((prevML) => ({
      ...prevML,
      [providerKeyML]: { ...prevML[providerKeyML], [fieldML]: valML },
    }));
  };

  const handleDragStartML = (indexML) => {
    dragIndexRef.current = indexML;
    setDraggingIndexML(indexML);
  };

  const handleDragOverML = (eML) => {
    eML.preventDefault();
  };

  const handleDropML = (dropIndexML) => {
    const fromIndexML = dragIndexRef.current;
    if (fromIndexML === null || fromIndexML === dropIndexML) return;

    setOrderML((prevML) => {
      const nextML = [...prevML];
      const [movedML] = nextML.splice(fromIndexML, 1);
      nextML.splice(dropIndexML, 0, movedML);
      return nextML;
    });
    dragIndexRef.current = null;
    setDraggingIndexML(null);
  };

  const handleDragEndML = () => {
    dragIndexRef.current = null;
    setDraggingIndexML(null);
  };

  const handleSaveML = () => {
    const formDataML = new FormData();
    Object.entries(valuesML).forEach(([keyML, valML]) => formDataML.set(keyML, String(valML)));

    formDataML.set("oidcWellKnownUrl", oidcValuesML.wellKnownUrl);

    formDataML.set("smtpHost", smtpValuesML.host);
    formDataML.set("smtpPort", smtpValuesML.port);
    formDataML.set("smtpUser", smtpValuesML.user);
    formDataML.set("smtpPass", smtpValuesML.pass);
    formDataML.set("smtpFromEmail", smtpValuesML.fromEmail);

    orderML.forEach((providerKeyML, indexML) => {
      const fieldsML = clientValuesML[providerKeyML];
      formDataML.set(`${providerKeyML}ClientId`, fieldsML.clientId);
      formDataML.set(`${providerKeyML}ClientSecret`, fieldsML.clientSecret);
      formDataML.set(`${providerKeyML}CallbackUrl`, fieldsML.callbackUrl);
      formDataML.set(`${providerKeyML}SortOrder`, String(indexML + 1));
    });

    fetcherML.submit(formDataML, { method: "POST" });
  };

  if (!registeredML) {
    return (
      <s-page inlineSize="950px">
        <TopIconNav active="settings" />

        <div style={stylesML.outerCard}>
          <div style={stylesML.lockWrap}>
            <LockIcon />
            <p style={stylesML.lockTitle}>Login Required</p>
            <p style={stylesML.lockDescription}>
              Create your account to access Settings and manage your social
              login providers.
            </p>
            <Link to="/app/account" style={stylesML.lockButton}>
              Go to Account
            </Link>
          </div>
        </div>
      </s-page>
    );
  }

  return (
    <s-page inlineSize="950px">
      <TopIconNav active="settings" />

      <div style={stylesML.outerCard}>
        <div style={stylesML.headerRow}>
          <div>
            <h1 style={stylesML.heading}>Configurations</h1>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <div style={saveWrapperStyleML()}>
              <button
                style={saveButtonStyleML(false)}
                onClick={() => setShowPreviewML(true)}
              >
                Login Preview
              </button>
            </div>
            <div style={saveWrapperStyleML()}>
              <button
                style={saveButtonStyleML(isSavingML)}
                disabled={isSavingML}
                onClick={handleSaveML}
              >
                {isSavingML ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>

        <div style={stylesML.tabBar}>
          <button
            type="button"
            style={tabButtonStyleML(activeTabML === "general")}
            onClick={() => setActiveTabML("general")}
          >
            General Settings
          </button>
          <button
            type="button"
            style={tabButtonStyleML(activeTabML === "client")}
            onClick={() => setActiveTabML("client")}
          >
            Client Settings
          </button>
          <button
            type="button"
            style={tabButtonStyleML(activeTabML === "smtp")}
            onClick={() => setActiveTabML("smtp")}
          >
            SMTP Settings
          </button>
        </div>

        {activeTabML === "general" && (
        <div style={stylesML.innerCard}>
          <div style={stylesML.licenseBox}>
            <div style={stylesML.licenseTitle}>License and Status</div>
            <hr style={stylesML.divider} />

            <div style={stylesML.rowBetween}>
              <div style={stylesML.label}>Serial Key</div>
              <div style={stylesML.serialPill}>{settingsML.serialKey}</div>
            </div>
            <hr style={stylesML.divider} />

            <div style={stylesML.rowBetween}>
              <div>
                <div style={stylesML.label}>Status</div>
                <div style={stylesML.subLabel}>
                  Enable or disable the app globally. When disabled, no recommendations will be
                  shown on your store.
                </div>
              </div>
              <ToggleSwitch checked={valuesML.appEnabled} onChange={() => toggleML("appEnabled")} />
            </div>
          </div>

          <div style={stylesML.providersBox}>
            <ProviderRow
              providerKey="google"
              name="Google"
              subtitle="Continue with Google"
              checked={valuesML.googleEnabled}
              onToggle={() => toggleML("googleEnabled")}
              logoUrl={settingsML.googleLogo}
            />
            <hr style={stylesML.divider} />
            <ProviderRow
              providerKey="linkedin"
              name="Linkedin"
              subtitle="Continue with Linkedin"
              checked={valuesML.linkedinEnabled}
              onToggle={() => toggleML("linkedinEnabled")}
              logoUrl={settingsML.linkedinLogo}
            />
            <hr style={stylesML.divider} />
            <ProviderRow
              providerKey="facebook"
              name="Facebook"
              subtitle="Continue with Facebook"
              checked={valuesML.facebookEnabled}
              onToggle={() => toggleML("facebookEnabled")}
              logoUrl={settingsML.facebookLogo}
            />
            <hr style={stylesML.divider} />
            <ProviderRow
              providerKey="twitter"
              name="X (Twitter)"
              subtitle="Continue with Twitter"
              checked={valuesML.twitterEnabled}
              onToggle={() => toggleML("twitterEnabled")}
              logoUrl={settingsML.twitterLogo}
            />
            <hr style={stylesML.divider} />
            <ProviderRow
              providerKey="amazon"
              name="Amazon"
              subtitle="Continue with Amazon"
              checked={valuesML.amazonEnabled}
              onToggle={() => toggleML("amazonEnabled")}
              logoUrl={settingsML.amazonLogo}
            />
          </div>

          <TabNavRowML
            onBackML={goBackTabML}
            onNextML={goNextTabML}
            isFirstML={activeTabIndexML === 0}
            isLastML={activeTabIndexML === tabOrderML.length - 1}
          />
        </div>
        )}

        {activeTabML === "client" && (
        <div style={stylesML.innerCard}>
          <div style={stylesML.subLabel}>
            Enter your own OAuth Client ID, Client Secret and Redirect URL for each provider.
            Drag a card by its handle to change the order providers appear in on your storefront
            login screen.
          </div>

          <OidcSettingsCard
            valuesML={oidcValuesML}
            identityProvidersDeepLinkML={identityProvidersDeepLinkML}
          />

          <div>
            {orderML.map((providerKeyML, indexML) => (
              <ClientSettingsCard
                key={providerKeyML}
                providerKey={providerKeyML}
                positionML={indexML + 1}
                valuesML={clientValuesML[providerKeyML]}
                onFieldChangeML={handleClientFieldChangeML}
                onDragStartML={() => handleDragStartML(indexML)}
                onDragOverML={handleDragOverML}
                onDropML={() => handleDropML(indexML)}
                onDragEndML={handleDragEndML}
                isDraggingML={draggingIndexML === indexML}
              />
            ))}
          </div>

          <TabNavRowML
            onBackML={goBackTabML}
            onNextML={goNextTabML}
            isFirstML={activeTabIndexML === 0}
            isLastML={activeTabIndexML === tabOrderML.length - 1}
          />
        </div>
        )}

        {activeTabML === "smtp" && (
        <div style={stylesML.innerCard}>
          <div style={stylesML.subLabel}>
            Configure the SMTP server used to send email login verification codes to your
            customers.
          </div>

          <SmtpSettingsCard
            valuesML={smtpValuesML}
            onFieldChangeML={(fieldML, valML) =>
              setSmtpValuesML((prevML) => ({ ...prevML, [fieldML]: valML }))
            }
          />

          <TabNavRowML
            onBackML={goBackTabML}
            onNextML={goNextTabML}
            isFirstML={activeTabIndexML === 0}
            isLastML={activeTabIndexML === tabOrderML.length - 1}
          />
        </div>
        )}
      </div>

      {showPreviewML && (
        <LoginPreviewModal
          values={valuesML}
          settings={settingsML}
          onClose={() => setShowPreviewML(false)}
        />
      )}
    </s-page>
  );
}

export const headers = (headersArgsML) => {
  return boundary.headers(headersArgsML);
};