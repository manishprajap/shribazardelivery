package io.ionic.starter;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private Intent pendingOrderIntent;
    private boolean bridgeReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Cold start: WebView/React may not be mounted yet.
        // Wait for the WebView to finish its first load before dispatching.
        getBridge().getWebView().post(() -> {
            getBridge().getWebView().postDelayed(() -> {
                bridgeReady = true;
                handleIncomingOrderIntent(getIntent());
            }, 1000); // gives React time to mount + register listeners
        });
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // App already running/foreground -> bridge is definitely ready
        handleIncomingOrderIntent(intent);
    }

    private void handleIncomingOrderIntent(Intent intent) {
        if (intent == null || !"incoming_order".equals(intent.getStringExtra("route"))) {
            return;
        }

        if (!bridgeReady) {
            // Save it, will be replayed once bridge finishes loading
            pendingOrderIntent = intent;
            return;
        }

        dispatchOrderEvent(intent);
    }

    private void dispatchOrderEvent(Intent intent) {
        String orderId = intent.getStringExtra("order_id");
        String customerName = intent.getStringExtra("customer_name");
        String address = intent.getStringExtra("address");
        String amount = intent.getStringExtra("amount");

        if (orderId == null) return;

        String js = "window.dispatchEvent(new CustomEvent('incomingOrder', { detail: {"
            + "orderId: " + jsonString(orderId) + ","
            + "customerName: " + jsonString(customerName) + ","
            + "address: " + jsonString(address) + ","
            + "amount: " + jsonString(amount)
            + "}}));";

        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(js, null)
        );
    }

    // ✅ FIX: prevents JS injection / broken JS if customerName or address
    // contain quotes, backslashes, or newlines (e.g. customer name with an apostrophe)
    private String jsonString(String value) {
        if (value == null) return "null";
        return "\"" + value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "") + "\"";
    }
}