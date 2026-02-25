import API from "./api";

export const signupUser = async (data:any) => {
  return API.post("/auth/signup", data);
};

export const loginUser = async (data:any) => {
  return API.post("/auth/login", data);
};
