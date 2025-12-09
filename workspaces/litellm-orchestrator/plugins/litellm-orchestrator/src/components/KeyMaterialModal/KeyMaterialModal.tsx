/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Alert from '@material-ui/lab/Alert';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { makeStyles } from '@material-ui/core/styles';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';

const useStyles = makeStyles(theme => ({
  secretBox: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    position: 'relative',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  copyButton: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
  },
  warningBox: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

export type KeyMaterialModalProps = {
  keySecret: string;
  keyId?: string;
  closeHandler: () => void;
};

export const KeyMaterialModal = ({
  keySecret,
  keyId,
  closeHandler,
}: KeyMaterialModalProps) => {
  const classes = useStyles();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await window.navigator.clipboard.writeText(keySecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy:', err);
    }
  };
  return (
    <>
      <DialogTitle>API Key Created Successfully</DialogTitle>
      <DialogContent>
        <Alert severity="warning" className={classes.warningBox}>
          <Typography variant="body2" component="div">
            <strong>Important:</strong> Save this key in a secure location. You
            will not be able to view it again after closing this dialog. If you
            lose this key, you will need to create a new one. This is the only
            time you will be able to see this secret. Make sure to store it
            securely before closing this dialog.
          </Typography>
        </Alert>

        {keyId && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Key ID: <strong>{keyId}</strong>
          </Typography>
        )}

        <Typography variant="subtitle2" gutterBottom>
          Your API Key Secret:
        </Typography>
        <Box className={classes.secretBox}>
          <IconButton
            size="small"
            className={classes.copyButton}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <FileCopyIcon fontSize="small" />
          </IconButton>
          <Typography variant="body1" component="pre" style={{ margin: 0 }}>
            {keySecret}
          </Typography>
        </Box>

        {copied && (
          <Alert severity="success" style={{ marginTop: 8 }}>
            Copied to clipboard!
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeHandler} color="primary" variant="contained">
          I've Saved It
        </Button>
      </DialogActions>
    </>
  );
};
