package com.aiind.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.MobileAds;

public class MainActivity extends BridgeActivity {

    private AppOpenAdManager appOpenAdManager;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        appOpenAdManager = new AppOpenAdManager();

        MobileAds.initialize(this, initializationStatus -> {
            appOpenAdManager.loadAd(this);
        });
    }

    @Override
    public void onResume() {
        super.onResume();

        if (appOpenAdManager != null) {
            appOpenAdManager.showAdIfAvailable(this);
        }
    }
}