<?php

namespace support;

use Webman\Http\Request as WebmanRequest;

class Request extends WebmanRequest
{
    /**
     * 获取所有输入数据
     */
    public function all(): array
    {
        return $this->post() + $this->get() + $this->file();
    }

    /**
     * 获取指定输入数据
     */
    public function input(string $key, $default = null)
    {
        $post = $this->post();
        $get = $this->get();

        return $post[$key] ?? $get[$key] ?? $default;
    }
}
