/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent } from '@ionic/react';

import {
  Button,
  MuiMaterial,
  Typography,
  Input,
  PasswordInput,
} from '@eten-lab/ui-kit';
import { useFormik } from 'formik';

import * as Yup from 'yup';
import axios from 'axios';

import * as querystring from 'qs';
// import { decodeToken } from '@/utils/AuthUtils';

const { Box, Alert } = MuiMaterial;

const validationSchema = Yup.object().shape({
  username: Yup.string().required('First name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
});

export function RegisterPage() {
  const [show, setShow] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const history = useHistory();
  const formik = useFormik<{
    email: string;
    username: string;
    password: string;
    passwordConfirm: string;
  }>({
    initialValues: {
      email: '',
      username: '',
      password: '',
      passwordConfirm: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      console.log(values.email);
      setErrorMessage('');
      setSuccessMessage('');
      const keycloakUrl = `${process.env.REACT_APP_KEYCLOAK_URL}`;

      try {
        await axios
          .post(
            `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
            querystring.stringify({
              client_id: 'admin-cli', // process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
              client_secret: 'hZJZWixwA1IOiPGp6M8BgV3KfEcs8XTk', // process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET,
              grant_type: 'client_credentials', //'password'
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
          )
          .then(async (response) => {
            console.log('response.data.access_token');
            // const token: any = decodeToken(response.data.access_token);

            try {
              await axios
                .post(
                  `${keycloakUrl}/admin/realms/showcase/users`,
                  {
                    username: values.username,
                    email: values.email,
                    enabled: true,
                    credentials: [
                      {
                        type: 'password',
                        value: values.password,
                      },
                    ],
                    emailVerified: true,
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${response.data.access_token}`,
                    },
                  },
                )
                .then((resp) => {
                  setSuccessMessage('User registration successfull');
                });
            } catch (error: any) {
              setErrorMessage(error.response.data.errorMessage);
              console.log(error);
            }
            // console.log(token.email);
            // history.push('/home');
          });
      } catch (error: any) {
        setErrorMessage(error.message);
      }
      //history.push('/login');
    },
  });

  const handleToggleShow = () => {
    setShow((show) => !show);
  };

  const handleGoLoginPage = () => {
    history.push('/login');
  };

  const handleRegister = () => {
    if (!formik.isValid) {
      return;
    }

    formik.submitForm();
  };

  return (
    <IonContent>
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: '123px 20px 20px 20px',
          gap: '12px',
        }}
        noValidate
        autoComplete="off"
      >
        <Typography
          variant="h1"
          color="text.dark"
          sx={{ marginBottom: '18px' }}
        >
          Register
        </Typography>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        <Input
          id="email"
          name="email"
          type="text"
          label="Email"
          onChange={formik.handleChange}
          value={formik.values.email}
          valid={formik.values.email !== '' ? !formik.errors.email : undefined}
          helperText={formik.errors.email}
          fullWidth
        />

        <Input
          id="username"
          name="username"
          type="text"
          label="Username"
          onChange={formik.handleChange}
          value={formik.values.username}
          valid={
            formik.values.username !== '' ? !formik.errors.username : undefined
          }
          helperText={formik.errors.username}
          fullWidth
        />

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          onChange={formik.handleChange}
          onClickShowIcon={handleToggleShow}
          show={show}
          value={formik.values.password}
          valid={
            formik.values.password !== '' ? !formik.errors.password : undefined
          }
          helperText={formik.errors.password}
          fullWidth
        />

        <PasswordInput
          id="passwordConfirm"
          name="passwordConfirm"
          label="Repeat Password"
          onChange={formik.handleChange}
          onClickShowIcon={handleToggleShow}
          show={show}
          value={formik.values.passwordConfirm}
          valid={
            formik.values.passwordConfirm !== ''
              ? !formik.errors.passwordConfirm
              : undefined
          }
          helperText={formik.errors.passwordConfirm}
          fullWidth
        />

        <Button
          variant="contained"
          endIcon
          fullWidth
          onClick={handleRegister}
          disabled={!formik.isValid}
        >
          Register Now
        </Button>

        <Button
          variant="text"
          endIcon
          fullWidth
          color="gray"
          onClick={handleGoLoginPage}
        >
          Do you have an account?
        </Button>
      </Box>
    </IonContent>
  );
}
