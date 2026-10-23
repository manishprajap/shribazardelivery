package io.ionic.starter.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import io.ionic.starter.MainActivity

class IncomingOrderMessagingService : FirebaseMessagingService() {

    companion object {
        const val CHANNEL_ID = "incoming_order_channel"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // ✅ Capacitor's PushNotifications plugin token listener (JS side
        // 'registration' event) still fires normally — Capacitor gets the
        // token via its own FirebaseInstanceId hook, not through this
        // service, so no change needed here.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data

        // ✅ Agar ye "incoming_order" nahi hai (matlab normal
        // delivery_assigned / order_status message hai), to us case me
        // Capacitor apna default handling khud nahi karega kyunki hum
        // uski service hata chuke hain — isliye humein khud forward
        // karna hoga taaki tumhara existing useFCM.ts (foreground listener)
        // aur system tray notification dono kaam karte rahein.
        if (data["type"] != "incoming_order") {
            forwardToDefaultNotification(message)
            return
        }

        val orderId      = data["order_id"] ?: return
        val customerName = data["customer_name"] ?: ""
        val address      = data["address"] ?: ""
        val amount       = data["amount"] ?: ""

        val ringIntent = Intent(this, RingtoneService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(ringIntent)
        } else {
            startService(ringIntent)
        }

        val fullScreenIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("route", "incoming_order")
            putExtra("order_id", orderId)
            putExtra("customer_name", customerName)
            putExtra("address", address)
            putExtra("amount", amount)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, orderId.hashCode(), fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val acceptIntent = Intent(this, OrderActionReceiver::class.java).apply {
            action = "ACTION_ACCEPT_ORDER"
            putExtra("order_id", orderId)
        }
        val acceptPending = PendingIntent.getBroadcast(
            this, (orderId + "accept").hashCode(), acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val rejectIntent = Intent(this, OrderActionReceiver::class.java).apply {
            action = "ACTION_REJECT_ORDER"
            putExtra("order_id", orderId)
        }
        val rejectPending = PendingIntent.getBroadcast(
            this, (orderId + "reject").hashCode(), rejectIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        createIncomingOrderChannel()

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setContentTitle("New Order #$orderId")
            .setContentText("$customerName • ₹$amount • $address")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Reject", rejectPending)
            .addAction(android.R.drawable.ic_menu_send, "Accept", acceptPending)
            .setOngoing(true)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(orderId.hashCode(), notification)
    }

    /**
     * ✅ Normal (non-incoming-order) messages ke liye — jaise Capacitor
     * khud karta, waisa hi default system-tray notification dikhao,
     * taaki delivery_assigned/order_status wale existing messages
     * pehle jaisa hi kaam karte rahein.
     */
    private fun forwardToDefaultNotification(message: RemoteMessage) {
        val title = message.notification?.title
            ?: message.data["title"]
            ?: "Notification"
        val body = message.notification?.body
            ?: message.data["body"]
            ?: ""

        val defaultChannelId = "default_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                defaultChannelId, "General", NotificationManager.IMPORTANCE_DEFAULT
            )
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            message.data.forEach { (k, v) -> putExtra(k, v) }
        }
        val pendingIntent = PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, defaultChannelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createIncomingOrderChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Incoming Orders", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000)
                lightColor = Color.RED
                enableLights(true)
                setSound(null, null)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }
}