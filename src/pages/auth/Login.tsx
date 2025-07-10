import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleToggleLoginMethod = () => {
    setIsEmailLogin(!isEmailLogin);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((isEmailLogin && !email) || (!isEmailLogin && !username) || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    dispatch(loginStart());
    
    try {
      let response;
      
      if (isEmailLogin) {
        // Admin login with email
        response = await mockApi.login(email, password);
      } else {
        // Other roles login with username
        response = await mockApi.loginWithUsername(username, password);
      }
      
      dispatch(loginSuccess(response));
      
      const { user } = response;
      const dashboardPath = getDashboardPath(user);
      
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate(dashboardPath);
    } catch (error) {
      dispatch(loginFailure('Invalid credentials'));
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDashboardPath = (user: any) => {
    if (user.roles.includes('Admin')) return '/admin';
    if (user.roles.includes('Chef')) return '/chef';
    if (user.roles.includes('WorkDutyManager')) return '/work-duty';
    if (user.roles.includes('Missionary')) return '/missionary';
    if (user.roles.includes('DTS')) return '/dts';
    if (user.roles.includes('Staff')) return '/staff';
    return '/login';
  };
  
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };
  
  return (
    <motion.div 
      className="max-w-md w-full mx-auto p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="flex items-center justify-center mb-8">
        <BookOpen size={36} className="text-blue-600" />
        <h2 className="text-3xl font-bold text-blue-600 ml-2">YWAM DAR</h2>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex mb-6 bg-gray-100 rounded-md p-1">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              isEmailLogin 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setIsEmailLogin(true)}
          >
            Admin (Email)
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              !isEmailLogin 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setIsEmailLogin(false)}
          >
            Staff (Username)
          </button>
        </div>
        
        <form onSubmit={handleLogin}>
          {isEmailLogin ? (
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., yefta@ydms.com"
              fullWidth
            />
          ) : (
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., sutanto"
              fullWidth
            />
          )}
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            fullWidth
          />
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
            className="mt-4"
          >
            Log in
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register here
            </Link>
          </p>
          <p className="mt-2 text-gray-500">
            Contact the admin if you need help with your account.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;