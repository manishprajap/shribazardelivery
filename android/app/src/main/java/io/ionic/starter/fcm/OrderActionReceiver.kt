package io.ionic.starter.fcm

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import io.ionic.starter.MainActivity

class OrderActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val orderId      = intent.getStringExtra("order_id") ?: return
        val customerName = intent.getStringExtra("customer_name") ?: ""
        val address      = intent.getStringExtra("address") ?: ""
        val amount       = intent.getStringExtra("amount") ?: ""
        val action       = intent.action ?: return

        // Stop ringing + clear the notification
        context.stopService(Intent(context, RingtoneService::class.java))
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(orderId.hashCode())

        // ✅ FIX: previously did nothing else — Accept/Reject taps only
        // silenced the ring. Now we open MainActivity and tell React
        // whether it was an accept or reject tap, so the JS side can
        // call the actual accept/reject API.
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "incoming_order")
            putExtra("order_id", orderId)
            putExtra("customer_name", customerName)
            putExtra("address", address)
            putExtra("amount", amount)
            putExtra("quick_action", if (action == "ACTION_ACCEPT_ORDER") "accept" else "reject")
        }
        context.startActivity(openIntent)
    }
}