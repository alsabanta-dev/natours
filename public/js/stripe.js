import axios from 'axios'
import { showAlert } from './alerts'
const stripe = Stripe('pk_test_51JVG3NKjApHvGdu4BdNbm0hjGknQ2HP6A4obrJRrPiW7PBKn23M70FWmWdeC9CXEcEGuI3VyAqk8Y8u8hzcavK5V00AnjmH4vN')

export const bookTour = async tourId => {
    try{
        console.log("Processing...")
        // 1) Get checkout session from API
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`)
        console.log(session)

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }catch(err){
        console.log(err)
        showAlert('error', err)
    }
}