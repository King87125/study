module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // 禁用import顺序检查
    'import/first': 'off',
    'import/order': 'off'
  }
}; 