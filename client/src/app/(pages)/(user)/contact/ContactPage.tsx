'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Smile, MapPin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import axios from 'axios'

const greetings = [
  { text: "Hello!", lang: "English" },
  { text: "नमस्ते!", lang: "Hindi" },
  { text: "¡Hola!", lang: "Spanish" },
  { text: "Bonjour!", lang: "French" },
  { text: "Ciao!", lang: "Italian" },
  { text: "こんにちは!", lang: "Japanese" },
  { text: "안녕하세요!", lang: "Korean" },
  { text: "Hej!", lang: "Swedish" },
  { text: "Hallo!", lang: "German" },
  { text: "Olá!", lang: "Portuguese" }
]

export default function ContactPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => (prev + 1) % greetings.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const validateForm = () => {
    let isValid = true
    const newErrors = { name: '', email: '', phone: '', message: '' }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
      isValid = false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      newErrors.email = 'Valid email is required'
      isValid = false
    }

    const phoneRegex = /^[0-9]{10}$/
    if (!formData.phone.trim() || !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Valid 10-digit phone number is required'
      isValid = false
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/contact/submit`, formData)

      if (response.data.success) {
        setSubmitStatus('success')
        setStatusMessage(response.data.message)
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
        setStatusMessage(response.data.message || 'Something went wrong. Please try again.')
      }
    } catch (error: any) {
      setSubmitStatus('error')
      setStatusMessage(error.response?.data?.message || 'Failed to submit the form. Please try again later.')
    } finally {
      setIsSubmitting(false)

      // Clear status after 5 seconds
      if (submitStatus === 'success') {
        setTimeout(() => {
          setSubmitStatus(null)
        }, 5000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <motion.section
        className="container mx-auto px-4 py-16 md:py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Column */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800">
                Say
              </span>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={currentGreeting}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {greetings[currentGreeting].text}
                  <span className="text-base font-normal text-gray-500">
                    ({greetings[currentGreeting].lang})
                  </span>
                </motion.h1>
              </AnimatePresence>
              <Smile className="w-8 h-8 md:w-12 md:h-12 " />
            </motion.div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-xs md:text-sm  text-gray-600">
                We're here to help and answer any question you might have. we look forward to hearing from you. any need help you please contact us or meet to office with coffee.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Map Section */}
        <motion.div
          className="relative rounded-2xl overflow-hidden mb-16 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="aspect-[16/9] md:aspect-[21/9] w-full relative  rounded-2xl overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.41130395627!2d77.11961147527161!3d28.647400883405727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d038d8ce0788f%3A0xae610d38e210b267!2sBansuri%20Vidya%20Mandir%20(Gurukul)!5e0!3m2!1sen!2sin!4v1741603651629!5m2!1sen!2sin"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="absolute bottom-0 right-0 p-6 md:p-8 bg-white rounded-tl-2xl max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Bansuri Vidya Mandir</h2>
            <p className="text-gray-600 mb-1">J-66 First Floor, near Metro Station, Block J</p>
            <p className="text-gray-600 mb-4">Rajouri Garden, New Delhi, India</p>

            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-semibold">T:</span> +91 9971145671
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">E:</span> bansurividya@gmail.com
              </p>
            </div>

            <motion.a
              href="https://maps.app.goo.gl/T4Fm3kA8V56xB2DB6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full mt-6 hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MapPin className="w-4 h-4" />
              View on google map
            </motion.a>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-12">
            How we can help you?
          </h2>

          {submitStatus && (
            <motion.div
              className={`mb-8 p-4 rounded-lg ${submitStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                {submitStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <p>{statusMessage}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR GOOD NAME*
                </label>
                <motion.input
                  type="text"
                  required
                  placeholder="What's your good name?"
                  className={`w-full px-4 py-3 border focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  whileFocus={{ scale: 1.01 }}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR EMAIL ADDRESS*
                </label>
                <motion.input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className={`w-full px-4 py-3 border focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  whileFocus={{ scale: 1.01 }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR PHONE NUMBER*
                </label>
                <motion.input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  className={`w-full px-4 py-3 border focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  whileFocus={{ scale: 1.01 }}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR SUBJECT
                </label>
                <motion.input
                  type="text"
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0"
                  whileFocus={{ scale: 1.01 }}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                YOUR MESSAGE
              </label>
              <motion.textarea
                rows={6}
                placeholder="Describe about your message"
                className={`w-full px-4 py-3 border focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all resize-none border-t-0 border-l-0 border-r-0 ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                whileFocus={{ scale: 1.01 }}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
            </div>

            <div className="flex items-center md:justify-between md:flex-row flex-col gap-4">
              <p className="text-sm text-gray-500 w-full md:w-1/2">
                We are committed to protecting your privacy. We will never collect information about you without your explicit consent.
              </p>

              <motion.button
                type="submit"
                className="inline-flex items-center gap-2 bg-gray-800 text-white px-8 py-4 rounded-full transition-colors disabled:bg-gray-400"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.span
                      key="submitting"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      Sending...
                    </motion.span>
                  ) : isHovered ? (
                    <motion.span
                      key="lets-talk"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      Let's Talk
                    </motion.span>
                  ) : (
                    <motion.span
                      key="send-message"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      Send message
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.section>
    </div>
  )
}

