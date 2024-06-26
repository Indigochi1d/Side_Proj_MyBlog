import Joi from "joi";
import User from "../../models/user.js";
/* 
    POST /api/auth/register
    {
        username : "beomuda",
        password : "pwd123"
    } 
*/
export const register = async (ctx) => {
  //Request Body 검증하기
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
  if (result.body) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  const { username, password } = ctx.request.body;
  try {
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409; //Confilct
      return;
    }
    const user = new User({
      username,
    });
    await user.setPassword(password); //비밀번호 설정
    await user.save(); //DB에 저장

    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set("access_token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true,
    });
  } catch (error) {
    ctx.throw(500, e);
  }
};

/* 
  POST /api/auth/login
  {
    username : "beomuda",
    password : "pwd123"
  }
*/
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;
  if (!username || !password) {
    ctx.status = 401;
    return;
  }
  try {
    const user = await User.findByUsername(username);
    if (!user) {
      ctx.status = 401;
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set("access_token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7일
      httpOnly: true,
    });
  } catch (error) {
    ctx.throw(500, error);
  }
};

/* 
  GET /api/auth/check 
*/
export const check = async (ctx) => {
  const {user} = ctx.state;
  if(!user){
    //Not Logged In
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};
/*
  POST /api/auth/logout  
*/
export const logout = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204; //No Content
};
