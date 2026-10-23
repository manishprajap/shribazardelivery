package io.ionic.starter.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import io.ionic.starter.R

class RingtoneService : Service() {

    private var mediaPlayer: MediaPlayer? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(9999, buildSilentNotification())
        startRinging()
        return START_NOT_STICKY
    }

    // ✅ FIX: purana code MediaPlayer.create() ka result null aane par
    // silently kuch nahi karta tha (koi crash, koi log nahi — bas ring
    // nahi bajti thi). Ab: 1) logging add ki 2) custom res/raw/ringtone
    // fail ho to phone ki DEFAULT ringtone pe fallback karta hai, taaki
    // ring kabhi bhi completely silent na rahe.
    private fun startRinging() {
        val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        try {
            mediaPlayer = MediaPlayer.create(this, R.raw.ringtone)
            if (mediaPlayer == null) {
                Log.e("RingtoneService", "R.raw.ringtone se MediaPlayer.create() null aaya — file missing/corrupt/unsupported format hai. Default ringtone use kar rahe hain.")
                startDefaultRingtoneFallback(attrs)
                return
            }

            mediaPlayer?.apply {
                isLooping = true
                setAudioAttributes(attrs)
                setOnErrorListener { _, what, extra ->
                    Log.e("RingtoneService", "MediaPlayer error: what=$what extra=$extra — fallback pe switch kar rahe hain")
                    release()
                    mediaPlayer = null
                    startDefaultRingtoneFallback(attrs)
                    true
                }
                start()
            }
        } catch (e: Exception) {
            Log.e("RingtoneService", "MediaPlayer.create() exception: ${e.message} — default ringtone fallback")
            startDefaultRingtoneFallback(attrs)
        }
    }

    private fun startDefaultRingtoneFallback(attrs: AudioAttributes) {
        try {
            val defaultUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            mediaPlayer = MediaPlayer().apply {
                setDataSource(this@RingtoneService, defaultUri)
                isLooping = true
                setAudioAttributes(attrs)
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e("RingtoneService", "Default ringtone fallback bhi fail hui: ${e.message}")
        }
    }

    private fun buildSilentNotification(): android.app.Notification {
        val channelId = "ringtone_service_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId, "Ringing", NotificationManager.IMPORTANCE_LOW
            )
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setContentTitle("Ringing...")
            .build()
    }

    override fun onDestroy() {
        try {
            mediaPlayer?.stop()
        } catch (_: Exception) { /* already stopped */ }
        mediaPlayer?.release()
        mediaPlayer = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}