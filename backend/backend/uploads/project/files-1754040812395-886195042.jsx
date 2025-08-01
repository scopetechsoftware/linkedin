import React from 'react'
import slider from 'react-slick'

const Home = ({name,age,email,phoneNo}) => {
    
  var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  }
 
  return (
     <Slider {...settings}>
      <div>
        <h3>1</h3>
      </div>
      <div>
        <h3>2</h3>
      </div>
      <div>
        <h3>3</h3>
      </div>
      <div>
        <h3>4</h3>
      </div>
      <div>
        <h3>5</h3>
      </div>
      <div>
    
    
        <h3>6</h3>
      </div>
    </Slider>
    <div>
        <h1>Home page</h1>
        <p>my name is {name} age is {age} emailId is {email} phone number is {phoneNo}</p>

    </div>
  )
}

export default Home