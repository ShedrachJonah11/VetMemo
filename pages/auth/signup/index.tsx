"use client";
import React, { useState } from "react";
import bg from "../../../public/bgauth.svg";
import star from "../../../public/star.svg";
import Image from "next/image";
import { Button, Card, CardBody, Checkbox, Input } from "@nextui-org/react";
import Link from "next/link";
import { EyeFilledIcon } from "../../../public/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../../../public/EyeSlashFilledIcon";
import { createAccount, loginGoogle } from "@/application/api/apis";
import Loader from "@/components/Loader";
import goggle from "../../../public/goggle.svg";
import arrowback from "../../../public/menu2.svg";
import { toast } from "react-toastify";
import router from "next/router";

function Index() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [userData, setUserData] = useState<any>({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [isLoading, setLoading] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  const isLoginButtonDisabled =
    !userData.first_name.trim() ||
    !userData.last_name.trim() ||
    !userData.password.trim() ||
    !userData.email.trim();

  const loginG = async () => {
    try {
      setLoading(true);
      const res = await loginGoogle();
      setLoading(false);
      if (window) {
        window.location.href = res.authorization_url;
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const register = async () => {
    console.log(userData);
    if (userData) {
      if (userData.email == "") {
        toast.error("Please enter your email.");
        return;
      }
      if (userData.first_name == "") {
        toast.error("Please enter your first name.");
        return;
      }
      if (userData.last_name == "") {
        toast.error("Please enter your last name.");
        return;
      }
      if (userData.password == "") {
        toast.error("Please enter your password.");
        return;
      }
      try {
        setLoading(true);
        const res = await createAccount(userData);
        setLoading(false);
        console.log(res);
        //signed up successfully
        router.push("/auth/check");
      } catch (error: any) {
        setLoading(false);
        console.log(error);
        if (error.response && error.response.data) {
          const { data } = error.response;

          if (data.detail === "REGISTER_INVALID_PASSWORD") {
            // Handle invalid password error
            toast.error("Invalid Password");
          } else if (data.detail === "REGISTER_USER_ALREADY_EXISTS") {
            // Handle user already exists error
            toast.error("Account already exist, please login");
          } else {
            // Handle other error scenarios
          }
        } else {
          // Handle other types of errors
        }
      }
    }
  };
  return (
    <div className="bg-cover bg-center h-screen flex items-center justify-center">
      <Image src={bg} alt="Background" layout="fill" objectFit="cover" />
      <Card className="w-96 sm:w-[450px]  p-6 bg-opacity-75 ">
        <CardBody className="flex flex-col items-center">
          <Image src={star} alt="" className="mt-2" />

          <h1 className="text-lg font-bold mb-2">Sign up</h1>
          <p className="text-gray-500 mb-6">Start your 3-day free trial.</p>
          <Input
            type="name"
            label="First Name"
            placeholder="Enter your first name"
            className="mb-4"
            variant="bordered"
            onChange={(e: any) => {
              userData.first_name = e.target.value;
              setUserData(userData);
            }}
          />
          <Input
            type="name"
            label="Last Name"
            placeholder="Enter your last name"
            variant="bordered"
            className="mb-4"
            onChange={(e: any) => {
              userData.last_name = e.target.value;
              setUserData(userData);
            }}
          />
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            variant="bordered"
            onChange={(e: any) => {
              userData.email = e.target.value;
              setUserData(userData);
            }}
          />
          <Input
            name="password"
            label="Password"
            placeholder="Create a password"
            variant="bordered"
            endContent={
              <button
                type="button"
                className="cursor-pointer "
                onClick={toggleVisibility}
              >
                {isVisible ? (
                  <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            type={isVisible ? "text" : "password"}
            className="mt-4"
            onChange={(e: any) => {
              const { name, value } = e.target;
              setUserData((prevState: any) => ({
                ...prevState,
                [name]: value,
              }));
            }}
          />

          <Button
            size="lg"
            className="w-full mt-6"
            onClick={() => {
              register();
            }}
            disabled={isLoginButtonDisabled}
            style={{
              backgroundColor: isLoginButtonDisabled ? "#CCCCCC" : "#008080",
            }}
          >
            <p className="text-white text-semibold ">Sign Up</p>
          </Button>

          <div className="flex items-center mt-6 mb-4">
            <div className="flex-1 border-t border-black"></div>
            <p className="mx-4">or</p>
            <div className="flex-1 border-t border-black"></div>
          </div>

          <Button
            size="lg"
            className="w-full bg-white mb-4"
            onClick={() => {
              loginG();
            }}
          >
            <Image src={goggle} alt="google" />
            <p>Sign up with Google</p>
          </Button>
          <div className="flex justify-center items-center">
            <p className="flex">
              Have an account already?
              <Link href={"/auth/login"} className="ml-1 text-[#008080]">
                login
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>

      {isLoading && <Loader type={"FULL"} />}
    </div>
  );
}

export default Index;
