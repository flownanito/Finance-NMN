package com.nmn.financeadvisor.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/dashboard",
        "/transactions",
        "/invoices",
        "/savings-plan",
        "/{path:^(?!api|h2-console|static|assets|favicon|.*\\.).*$}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
