import { User } from "../models/user";

export const signUp = async (req: any, res: Response) => {
    const user = User.create({ ...req.body }) 
    
}